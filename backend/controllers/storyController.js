const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Story = require("../models/Story");
const Notification = require("../models/Notification");
const { uploadBufferToCloudinary, deleteFromCloudinary } = require("../utils/cloudinaryUpload");

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
const createStory = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Please upload an image for the story");
  }

  const result = await uploadBufferToCloudinary(req.file.buffer, "instaclone/stories");

  const story = await Story.create({
    user: req.user._id,
    image: { url: result.secure_url, publicId: result.public_id },
  });

  const populatedStory = await Story.findById(story._id).populate(
    "user",
    "username name avatar"
  );

  res.status(201).json({ success: true, story: populatedStory });
});

// @desc    Get active stories grouped by user (for the story bar).
//          Only includes stories from users the current user follows + their own.
//          If not logged in, returns an empty list (stories are a "logged in" feature).
// @route   GET /api/stories
// @access  Private
const getStories = asyncHandler(async (req, res) => {
  const followingIds = req.user.following || [];
  const userIds = [...followingIds, req.user._id];

  const stories = await Story.find({ user: { $in: userIds } })
    .sort({ createdAt: -1 })
    .populate("user", "username name avatar");

  // Group stories by user so the frontend can render one avatar per user,
  // with that user's stories in an array behind it.
  const grouped = {};
  for (const story of stories) {
    const uid = story.user._id.toString();
    if (!grouped[uid]) {
      grouped[uid] = {
        user: story.user,
        stories: [],
      };
    }
    const obj = story.toObject();
    obj.isViewed = story.viewers.some(
      (id) => id.toString() === req.user._id.toString()
    );
    obj.isLiked = (story.likes || []).some(
      (id) => id.toString() === req.user._id.toString()
    );
    obj.likesCount = (story.likes || []).length;
    grouped[uid].stories.push(obj);
  }

  // Put the current user's own stories first (if any), rest sorted by most recent story
  const groupsArray = Object.values(grouped).sort((a, b) => {
    if (a.user._id.toString() === req.user._id.toString()) return -1;
    if (b.user._id.toString() === req.user._id.toString()) return 1;
    return new Date(b.stories[0].createdAt) - new Date(a.stories[0].createdAt);
  });

  res.status(200).json({ success: true, storyGroups: groupsArray });
});

// @desc    Mark a story as viewed by the current user
// @route   POST /api/stories/:id/view
// @access  Private
const viewStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);

  if (!story) {
    res.status(404);
    throw new Error("Story not found");
  }

  const alreadyViewed = story.viewers.some(
    (id) => id.toString() === req.user._id.toString()
  );

  if (!alreadyViewed) {
    story.viewers.push(req.user._id);
    await story.save();
  }

  res.status(200).json({ success: true });
});

// @desc    Toggle like on a story (like if not liked, unlike if already liked).
//          Creates a "story_like" notification for the story owner on like
//          (not on unlike — matches how Instagram/most apps avoid noisy
//          notifications for a quick like/unlike toggle).
// @route   POST /api/stories/:id/like
// @access  Private
const toggleLikeStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);

  if (!story) {
    res.status(404);
    throw new Error("Story not found");
  }

  const alreadyLiked = story.likes.some(
    (id) => id.toString() === req.user._id.toString()
  );

  if (alreadyLiked) {
    story.likes = story.likes.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
  } else {
    story.likes.push(req.user._id);
  }

  await story.save();

  const isNowLiked = !alreadyLiked;
  const storyOwnerId = story.user.toString();

  // Don't notify yourself for liking your own story, and only notify on the
  // like action itself (not the unlike)
  if (isNowLiked && storyOwnerId !== req.user._id.toString()) {
    const notification = await Notification.create({
      recipient: storyOwnerId,
      sender: req.user._id,
      type: "story_like",
      story: story._id,
    });
    const populatedNotification = await notification.populate(
      "sender",
      "username name avatar"
    );

    const io = req.app.get("io");
    io.to(storyOwnerId).emit("newNotification", populatedNotification);
  }

  res.status(200).json({
    success: true,
    isLiked: isNowLiked,
    likesCount: story.likes.length,
  });
});

// @desc    Get the "seen by" list for a story — viewers plus who liked it.
//          Only the story owner can view this (matches real Instagram).
// @route   GET /api/stories/:id/seen-by
// @access  Private
const getStorySeenBy = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id)
    .populate("viewers", "username name avatar")
    .populate("likes", "username name avatar");

  if (!story) {
    res.status(404);
    throw new Error("Story not found");
  }

  if (story.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to view this");
  }

  const likedIds = new Set(story.likes.map((u) => u._id.toString()));

  // Most recent viewer first (viewers array is appended-to in view order),
  // with an isLiked flag per viewer so the frontend can show a heart next
  // to whoever liked it — same as Instagram's story viewers list.
  const viewers = [...story.viewers].reverse().map((v) => ({
    _id: v._id,
    username: v.username,
    name: v.name,
    avatar: v.avatar,
    isLiked: likedIds.has(v._id.toString()),
  }));

  res.status(200).json({
    success: true,
    viewersCount: viewers.length,
    likesCount: story.likes.length,
    viewers,
  });
});

// @desc    Delete a story (owner only) — removes the image from Cloudinary
//          and cleans up any "story_like" notifications pointing at it so
//          nothing is left orphaned in the DB.
// @route   DELETE /api/stories/:id
// @access  Private
const deleteStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);

  if (!story) {
    res.status(404);
    throw new Error("Story not found");
  }

  if (story.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this story");
  }

  if (story.image?.publicId) {
    await deleteFromCloudinary(story.image.publicId);
  }

  await Notification.deleteMany({ type: "story_like", story: story._id }).catch(() => null);

  await story.deleteOne();

  res.status(200).json({ success: true });
});

module.exports = {
  createStory,
  getStories,
  viewStory,
  toggleLikeStory,
  getStorySeenBy,
  deleteStory,
};