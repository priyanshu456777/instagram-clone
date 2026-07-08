const asyncHandler = require("express-async-handler");
const { validationResult } = require("express-validator");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const Notification = require("../models/Notification");

// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  const comment = await Comment.create({
    post: post._id,
    user: req.user._id,
    text: req.body.text,
  });

  post.commentsCount += 1;
  await post.save();

  const populatedComment = await Comment.findById(comment._id).populate(
    "user",
    "username name avatar"
  );

  // Notify post owner in real time
  if (post.user.toString() !== req.user._id.toString()) {
    const notification = await Notification.create({
      recipient: post.user,
      sender: req.user._id,
      type: "comment",
      post: post._id,
    });
    const io = req.app.get("io");
    io.to(post.user.toString()).emit("newNotification", {
      type: "comment",
      from: { _id: req.user._id, username: req.user.username, avatar: req.user.avatar },
      postId: post._id,
      createdAt: notification.createdAt,
    });
  }

  // Broadcast the new comment live to anyone viewing this post
  const io = req.app.get("io");
  io.to(`post:${post._id}`).emit("newComment", {
    postId: post._id,
    comment: populatedComment,
    commentsCount: post.commentsCount,
  });

  res.status(201).json({ success: true, comment: populatedComment, commentsCount: post.commentsCount });
});

// @desc    Get all comments for a post (paginated, newest last for chat-like reading order)
// @route   GET /api/posts/:id/comments
// @access  Public
const getComments = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    Comment.find({ post: req.params.id })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username name avatar"),
    Comment.countDocuments({ post: req.params.id }),
  ]);

  res.status(200).json({ success: true, count: comments.length, total, comments });
});

// @desc    Delete a comment (only comment owner or post owner can delete)
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    res.status(404);
    throw new Error("Comment not found");
  }

  const post = await Post.findById(comment.post);

  const isCommentOwner = comment.user.toString() === req.user._id.toString();
  const isPostOwner = post && post.user.toString() === req.user._id.toString();

  if (!isCommentOwner && !isPostOwner) {
    res.status(403);
    throw new Error("You are not authorized to delete this comment");
  }

  await comment.deleteOne();

  if (post) {
    post.commentsCount = Math.max(0, post.commentsCount - 1);
    await post.save();

    const io = req.app.get("io");
    io.to(`post:${post._id}`).emit("commentDeleted", {
      postId: post._id,
      commentId: comment._id,
      commentsCount: post.commentsCount,
    });
  }

  res.status(200).json({ success: true, message: "Comment deleted successfully" });
});

module.exports = { addComment, getComments, deleteComment };
