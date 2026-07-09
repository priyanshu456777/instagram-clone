// backend/controllers/commentController.js

// Polymorphic comment controller — same endpoints handle Posts AND Reels

// All external dependencies (notifications, etc.) are optional + lazy-loaded

// so the file works even if optional utils don't exist


const mongoose = require("mongoose");

const asyncHandler = require("express-async-handler");

const Comment = require("../models/Comment");

const Post = require("../models/Post");

const Reel = require("../models/Reel");


// Lazy-load notifications so it's optional — won't crash if utils/notifications.js is missing

let createNotification = null;

try {

  const notifMod = require("../utils/notifications");

  createNotification = notifMod.createNotification || notifMod.default || notifMod;

} catch (e) {

  // No notifications module — that's fine, comments still work

  createNotification = async () => Promise.resolve();

}


// Helper — verify target exists and return the doc

async function resolveTarget(targetType, targetId) {

  if (!["post", "reel"].includes(targetType)) {

    const err = new Error("Invalid targetType. Must be 'post' or 'reel'.");

    err.statusCode = 400;

    throw err;

  }

  if (!mongoose.Types.ObjectId.isValid(targetId)) {

    const err = new Error("Invalid targetId.");

    err.statusCode = 400;

    throw err;

  }

  const Model = targetType === "post" ? Post : Reel;

  const doc = await Model.findById(targetId).select("_id author").lean();

  if (!doc) {

    const err = new Error(`${targetType} not found.`);

    err.statusCode = 404;

    throw err;

  }

  return doc;

}


// @desc    Add a comment to a post or reel (or reply to a comment)

// @route   POST /api/comments

// @access  Private

const addComment = asyncHandler(async (req, res) => {

  const { text, targetType, targetId, parentComment } = req.body;


  if (!text || !text.trim()) {

    res.status(400);

    throw new Error("Comment text is required.");

  }


  const target = await resolveTarget(targetType, targetId);


  if (parentComment) {

    if (!mongoose.Types.ObjectId.isValid(parentComment)) {

      res.status(400);

      throw new Error("Invalid parentComment id.");

    }

    const parent = await Comment.findById(parentComment).select("_id targetType targetId").lean();

    if (!parent) {

      res.status(404);

      throw new Error("Parent comment not found.");

    }

    if (parent.targetType !== targetType || parent.targetId.toString() !== targetId) {

      res.status(400);

      throw new Error("Parent comment does not belong to this target.");

    }

  }


  const comment = await Comment.create({

    text: text.trim(),

    author: req.user._id,

    targetType,

    targetId,

    parentComment: parentComment || null,

  });


  const populated = await Comment.findById(comment._id)

    .populate("author", "username name avatar")

    .lean();


  // Fire-and-forget notification (no-op if utils/notifications.js doesn't exist)

  if (

    createNotification &&

    target.author &&

    target.author.toString() !== req.user._id.toString()

  ) {

    Promise.resolve(

      createNotification({

        recipient: target.author,

        sender: req.user._id,

        type: parentComment ? "reply" : "comment",

        targetType,

        targetId,

      })

    ).catch((e) => console.warn("[comment] notification skipped:", e.message));

  }


  res.status(201).json({ success: true, comment: populated });

});


// @desc    Get all comments for a post or reel (with replies nested)

// @route   GET /api/comments?targetType=post&targetId=...

// @access  Public

const getComments = asyncHandler(async (req, res) => {

  const { targetType, targetId } = req.query;


  await resolveTarget(targetType, targetId);


  const topLevel = await Comment.find({

    targetType,

    targetId,

    parentComment: null,

  })

    .sort({ createdAt: -1 })

    .populate("author", "username name avatar")

    .lean();


  const replyIds = topLevel.map((c) => c._id);

  const replies = await Comment.find({

    parentComment: { $in: replyIds },

  })

    .sort({ createdAt: 1 })

    .populate("author", "username name avatar")

    .lean();


  const replyMap = {};

  for (const r of replies) {

    const key = r.parentComment.toString();

    if (!replyMap[key]) replyMap[key] = [];

    replyMap[key].push(r);

  }


  const comments = topLevel.map((c) => ({

    ...c,

    replies: replyMap[c._id.toString()] || [],

  }));


  res.json({ success: true, count: comments.length, comments });

});


// @desc    Delete a comment (own only)

// @route   DELETE /api/comments/:id

// @access  Private

const deleteComment = asyncHandler(async (req, res) => {

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {

    res.status(400);

    throw new Error("Invalid comment id.");

  }


  const comment = await Comment.findById(id);

  if (!comment) {

    res.status(404);

    throw new Error("Comment not found.");

  }

  if (comment.author.toString() !== req.user._id.toString()) {

    res.status(403);

    throw new Error("Not authorized to delete this comment.");

  }


  await Comment.deleteMany({

    $or: [{ _id: comment._id }, { parentComment: comment._id }],

  });


  res.json({ success: true, message: "Comment deleted." });

});


// @desc    Like / unlike a comment

// @route   POST /api/comments/:id/like

// @access  Private

const toggleCommentLike = asyncHandler(async (req, res) => {

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {

    res.status(400);

    throw new Error("Invalid comment id.");

  }


  const comment = await Comment.findById(id);

  if (!comment) {

    res.status(404);

    throw new Error("Comment not found.");

  }


  const userId = req.user._id.toString();

  const idx = comment.likes.findIndex((u) => u.toString() === userId);

  let liked;

  if (idx >= 0) {

    comment.likes.splice(idx, 1);

    liked = false;

  } else {

    comment.likes.push(req.user._id);

    liked = true;

  }

  await comment.save();


  res.json({ success: true, liked, likeCount: comment.likes.length });

});


module.exports = { addComment, getComments, deleteComment, toggleCommentLike };

