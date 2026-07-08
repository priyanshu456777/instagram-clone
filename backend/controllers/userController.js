const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const { uploadBufferToCloudinary, deleteFromCloudinary } = require("../utils/cloudinaryUpload");

// @desc    Get a user's public profile + their posts (by username)
// @route   GET /api/users/:username
// @access  Public
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username.toLowerCase() })
    .populate("followers", "username name avatar")
    .populate("following", "username name avatar");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const posts = await Post.find({ user: user._id })
    .sort({ createdAt: -1 })
    .populate("user", "username name avatar");

  const isFollowing = req.user
    ? user.followers.some((f) => f._id.toString() === req.user._id.toString())
    : false;

  res.status(200).json({
    success: true,
    user,
    isFollowing,
    postsCount: posts.length,
    posts,
  });
});

// @desc    Update logged-in user's profile details
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "bio", "location", "profession"];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, user });
});

// @desc    Upload/replace profile avatar
// @route   PUT /api/users/avatar
// @access  Private
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Please upload an image");
  }

  const user = await User.findById(req.user._id);

  if (user.avatar && user.avatar.publicId) {
    await deleteFromCloudinary(user.avatar.publicId);
  }

  const result = await uploadBufferToCloudinary(req.file.buffer, "instaclone/avatars");
  user.avatar = { url: result.secure_url, publicId: result.public_id };
  await user.save();

  res.status(200).json({ success: true, avatar: user.avatar });
});

// @desc    Follow or unfollow a user (toggle) — real-time notification
// @route   PUT /api/users/:id/follow
// @access  Private
const toggleFollow = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot follow yourself");
  }

  const targetUser = await User.findById(req.params.id);
  if (!targetUser) {
    res.status(404);
    throw new Error("User not found");
  }

  const currentUser = await User.findById(req.user._id);
  const isFollowing = currentUser.following.some((id) => id.toString() === req.params.id);

  if (isFollowing) {
    currentUser.following = currentUser.following.filter((id) => id.toString() !== req.params.id);
    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
  } else {
    currentUser.following.push(targetUser._id);
    targetUser.followers.push(currentUser._id);

    const notification = await Notification.create({
      recipient: targetUser._id,
      sender: currentUser._id,
      type: "follow",
    });
    const io = req.app.get("io");
    io.to(targetUser._id.toString()).emit("newNotification", {
      type: "follow",
      from: { _id: currentUser._id, username: currentUser.username, avatar: currentUser.avatar },
      createdAt: notification.createdAt,
    });
  }

  await currentUser.save();
  await targetUser.save();

  res.status(200).json({
    success: true,
    isFollowing: !isFollowing,
    followersCount: targetUser.followers.length,
  });
});

// @desc    Save/unsave (bookmark) a post (toggle)
// @route   PUT /api/users/save/:postId
// @access  Private
const toggleSavePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  const user = await User.findById(req.user._id);
  const alreadySaved = user.savedPosts.some((id) => id.toString() === req.params.postId);

  if (alreadySaved) {
    user.savedPosts = user.savedPosts.filter((id) => id.toString() !== req.params.postId);
  } else {
    user.savedPosts.push(post._id);
  }

  await user.save();

  res.status(200).json({ success: true, isSaved: !alreadySaved });
});

// @desc    Get all posts saved/bookmarked by the logged-in user
// @route   GET /api/users/saved
// @access  Private
const getSavedPosts = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: "savedPosts",
    populate: { path: "user", select: "username name avatar" },
    options: { sort: { createdAt: -1 } },
  });

  res.status(200).json({ success: true, posts: user.savedPosts });
});

// @desc    Search users by username/name (for the search page)
// @route   GET /api/users/search/:query
// @access  Public
const searchUsers = asyncHandler(async (req, res) => {
  const query = req.params.query.trim();
  if (!query) {
    return res.status(200).json({ success: true, users: [] });
  }

  const users = await User.find({
    $or: [
      { username: { $regex: query, $options: "i" } },
      { name: { $regex: query, $options: "i" } },
    ],
  })
    .select("username name avatar")
    .limit(20);

  res.status(200).json({ success: true, users });
});

module.exports = {
  getProfile,
  updateProfile,
  updateAvatar,
  toggleFollow,
  toggleSavePost,
  getSavedPosts,
  searchUsers,
};
