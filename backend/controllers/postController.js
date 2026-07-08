const asyncHandler = require("express-async-handler");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const { uploadBufferToCloudinary, deleteFromCloudinary } = require("../utils/cloudinaryUpload");

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Please upload an image for the post");
  }

  const { caption } = req.body;

  const result = await uploadBufferToCloudinary(req.file.buffer, "instaclone/posts");

  const post = await Post.create({
    user: req.user._id,
    image: { url: result.secure_url, publicId: result.public_id },
    caption: caption || "",
  });

  const populatedPost = await Post.findById(post._id).populate(
    "user",
    "username name avatar"
  );

  res.status(201).json({ success: true, post: populatedPost });
});

// @desc    Get paginated feed (newest first) — "following" or "forYou" mode
// @route   GET /api/posts?page=1&limit=10&type=following|forYou
// @access  Public (optionalAuth attaches req.user if logged in)
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
    // req.user.following holds ObjectIds of followed users; include own posts too
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

  const postsWithLikeStatus = posts.map((post) => {
    const obj = post.toObject();
    obj.isLiked = req.user
      ? post.likes.some((id) => id.toString() === req.user._id.toString())
      : false;
    return obj;
  });

  res.status(200).json({
    success: true,
    count: posts.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    posts: postsWithLikeStatus,
  });
});

// @desc    Get a single post by id
// @route   GET /api/posts/:id
// @access  Public
const getPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate("user", "username name avatar");

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  const obj = post.toObject();
  obj.isLiked = req.user
    ? post.likes.some((id) => id.toString() === req.user._id.toString())
    : false;

  res.status(200).json({ success: true, post: obj });
});

// @desc    Get all posts by a specific user (for profile page)
// @route   GET /api/posts/user/:userId
// @access  Public
const getPostsByUser = asyncHandler(async (req, res) => {
  const posts = await Post.find({ user: req.params.userId })
    .sort({ createdAt: -1 })
    .populate("user", "username name avatar");

  res.status(200).json({ success: true, count: posts.length, posts });
});

// @desc    Delete a post (only owner can delete)
// @route   DELETE /api/posts/:id
// @access  Private
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

  await deleteFromCloudinary(post.image.publicId);
  await Comment.deleteMany({ post: post._id });
  await post.deleteOne();

  res.status(200).json({ success: true, message: "Post deleted successfully" });
});

// @desc    Like or unlike a post (toggle) — emits real-time update via Socket.io
// @route   PUT /api/posts/:id/like
// @access  Private
const toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  const userId = req.user._id.toString();
  const alreadyLiked = post.likes.some((id) => id.toString() === userId);

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
        from: { _id: req.user._id, username: req.user.username, avatar: req.user.avatar },
        postId: post._id,
        createdAt: notification.createdAt,
      });
    }
  }

  await post.save();

  const likesCount = post.likes.length;
  const isLiked = !alreadyLiked;

  const io = req.app.get("io");
  io.to(`post:${post._id}`).emit("likeUpdate", {
    postId: post._id,
    likesCount,
  });

  res.status(200).json({ success: true, isLiked, likesCount });
});

module.exports = { createPost, getFeed, getPost, getPostsByUser, deletePost, toggleLike };