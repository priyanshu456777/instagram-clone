// backend/controllers/postController.js — REPLACE existing file.
// Added: toggleSave + getSavedPosts + isSaved/isLiked attached to post objects.
// All existing logic preserved.

const asyncHandler = require("express-async-handler");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const { uploadBufferToCloudinary, deleteFromCloudinary } = require("../utils/cloudinaryUpload");

// Hashtag/mention extractors (kept inline for portability — no new util file needed).
const extractHashtags = (text = "") => {
  const matches = text.match(/#[\p{L}\p{N}_]+/gu) || [];
  return matches.map((t) => t.slice(1).toLowerCase()).filter(Boolean);
};
const extractMentions = async (text = "") => {
  const matches = text.match(/@([a-zA-Z0-9_.]+)/g) || [];
  const usernames = [...new Set(matches.map((m) => m.slice(1)))];
  if (usernames.length === 0) return [];
  const User = require("../models/User");
  const users = await User.find({ username: { $in: usernames } }, "_id");
  return users.map((u) => u._id);
};

// @desc Create a new post (supports carousel — 1 to 10 images)
// @route POST /api/posts
// @access Private
const createPost = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("Please upload at least one image");
  }
  if (req.files.length > 10) {
    res.status(400);
    throw new Error("Maximum 10 images per post");
  }

  const { caption, location } = req.body;

  // Upload all images to Cloudinary in parallel.
  const uploads = await Promise.all(
    req.files.map((file) =>
      uploadBufferToCloudinary(file.buffer, "instaclone/posts")
    )
  );

  const hashtags = extractHashtags(caption || "");
  const mentionIds = await extractMentions(caption || "");

  const post = await Post.create({
    user: req.user._id,
    images: uploads.map((u) => ({ url: u.secure_url, publicId: u.public_id })),
    caption: caption || "",
    location: location || "",
    hashtags,
    mentions: mentionIds,
  });

  const populatedPost = await Post.findById(post._id).populate(
    "user",
    "username name avatar"
  );

  // Fire mention notifications in the background — don't block the response.
  if (mentionIds.length > 0) {
    const Notification = require("../models/Notification");
    Promise.all(
      mentionIds
        .filter((id) => id.toString() !== req.user._id.toString())
        .map((recipientId) =>
          Notification.create({
            recipient: recipientId,
            sender: req.user._id,
            type: "mention",
            post: post._id,
          }).catch(() => null)
        )
    );
  }

  res.status(201).json({ success: true, post: populatedPost });
});

// Attach `isLiked` and `isSaved` flags so the frontend doesn't need to compare.
const attachUserFlags = (posts, userId) => {
  if (!Array.isArray(posts)) {
    if (!posts) return posts;
    const obj = posts.toObject ? posts.toObject() : posts;
    obj.isLiked = userId
      ? (obj.likes || []).some((id) => id.toString() === userId.toString())
      : false;
    obj.isSaved = userId
      ? (obj.saved || []).some((id) => id.toString() === userId.toString())
      : false;
    return obj;
  }
  return posts.map((p) => {
    const obj = p.toObject ? p.toObject() : p;
    obj.isLiked = userId
      ? (obj.likes || []).some((id) => id.toString() === userId.toString())
      : false;
    obj.isSaved = userId
      ? (obj.saved || []).some((id) => id.toString() === userId.toString())
      : false;
    return obj;
  });
};

// @desc Get paginated feed (newest first)
// @route GET /api/posts?page=1&limit=10&type=following|forYou
// @access Public (optionalAuth attaches req.user if logged in)
const getFeed = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const skip = (page - 1) * limit;
  const type = req.query.type || "forYou";

  let filter = {};
  if (type === "following") {
    if (!req.user) {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        page,
        totalPages: 0,
        posts: [],
      });
    }
    filter = { user: { $in: [...req.user.following, req.user._id] } };
  }

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username name avatar"),
    Post.countDocuments(filter),
  ]);

  const decorated = attachUserFlags(posts, req.user?._id);

  res.status(200).json({
    success: true,
    count: decorated.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    posts: decorated,
  });
});

// @desc Get a single post by id
// @route GET /api/posts/:id
// @access Public
const getPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate(
    "user",
    "username name avatar"
  );
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }
  const obj = attachUserFlags(post, req.user?._id);
  res.status(200).json({ success: true, post: obj });
});

// @desc Get all posts by a specific user
// @route GET /api/posts/user/:userId
// @access Public
const getPostsByUser = asyncHandler(async (req, res) => {
  const posts = await Post.find({ user: req.params.userId })
    .sort({ createdAt: -1 })
    .populate("user", "username name avatar");
  const decorated = attachUserFlags(posts, req.user?._id);
  res.status(200).json({ success: true, count: decorated.length, posts: decorated });
});

// @desc Get posts by hashtag
// @route GET /api/posts/hashtag/:tag
// @access Public
const getPostsByHashtag = asyncHandler(async (req, res) => {
  const tag = (req.params.tag || "").toLowerCase().replace(/^#/, "");
  if (!tag) {
    res.status(400);
    throw new Error("Tag is required");
  }
  const posts = await Post.find({ hashtags: tag })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("user", "username name avatar");
  const decorated = attachUserFlags(posts, req.user?._id);
  res.status(200).json({ success: true, count: decorated.length, posts: decorated });
});

// @desc Delete a post (only owner can delete)
// @route DELETE /api/posts/:id
// @access Private
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }
  if (post.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You are not authorized to delete this post");
  }

  // Delete all images from Cloudinary (carousels have multiple).
  if (post.images && post.images.length > 0) {
    await Promise.all(
      post.images.map((img) => deleteFromCloudinary(img.publicId).catch(() => null))
    );
  }
  await Comment.deleteMany({ post: post._id });
  await post.deleteOne();

  res.status(200).json({ success: true, message: "Post deleted successfully" });
});

// @desc Like or unlike a post (toggle) — emits real-time update via Socket.io
// @route PUT /api/posts/:id/like
// @access Private
const toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  const userId = req.user._id.toString();
  const alreadyLiked = (post.likes || []).some((id) => id.toString() === userId);

  if (alreadyLiked) {
    post.likes = post.likes.filter((id) => id.toString() !== userId);
  } else {
    post.likes.push(req.user._id);

    if (post.user.toString() !== userId) {
      const notification = await Notification.create({
        recipient: post.user,
        sender: req.user._id,
        type: "like",
        post: post._id,
      });

      const io = req.app.get("io");
      io.to(post.user.toString()).emit("newNotification", {
        type: "like",
        from: {
          _id: req.user._id,
          username: req.user.username,
          avatar: req.user.avatar,
        },
        postId: post._id,
        createdAt: notification.createdAt,
      });
    }
  }

  await post.save();
  const likesCount = post.likes.length;
  const isLiked = !alreadyLiked;

  const io = req.app.get("io");
  io.to(`post:${post._id}`).emit("likeUpdate", { postId: post._id, likesCount });

  res.status(200).json({ success: true, isLiked, likesCount });
});

// @desc Save or unsave a post (toggle) — bookmark feature
// @route PUT /api/posts/:id/save
// @access Private
const toggleSave = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  const userId = req.user._id.toString();
  const alreadySaved = (post.saved || []).some((id) => id.toString() === userId);

  if (alreadySaved) {
    post.saved = post.saved.filter((id) => id.toString() !== userId);
  } else {
    post.saved.push(req.user._id);
  }

  await post.save();

  res.status(200).json({
    success: true,
    isSaved: !alreadySaved,
    savesCount: post.saved.length,
  });
});

// @desc Get all posts saved by the current user
// @route GET /api/posts/saved
// @access Private
const getSavedPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ saved: req.user._id })
    .sort({ createdAt: -1 })
    .populate("user", "username name avatar");
  const decorated = attachUserFlags(posts, req.user._id);
  res.status(200).json({ success: true, count: decorated.length, posts: decorated });
});

module.exports = {
  createPost,
  getFeed,
  getPost,
  getPostsByUser,
  getPostsByHashtag,
  deletePost,
  toggleLike,
  toggleSave,
  getSavedPosts,
};