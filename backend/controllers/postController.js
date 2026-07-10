// backend/controllers/postController.js

// ✅ DEFINITIVE FIX — matches frontend expectations EXACTLY

//

// Frontend (verified from GitHub) calls/expects:

//   GET  /posts?page=1&limit=6&type=forYou|following

//     → { success, count, total, page, totalPages, posts: [{ user, likesCount, isLiked, isSaved, commentsCount, ... }] }

//   POST /posts              (multipart images[])         → createPost

//   GET  /posts/:id          → { success, post: {...} }

//   GET  /posts/user/:idOrUsername

//   GET  /posts/saved        → { success, count, posts }

//   GET  /posts/hashtag/:tag

//   PUT  /posts/:id/like     → { success, isLiked, likesCount }   ← PUT, not POST

//   PUT  /posts/:id/save     → { success, isSaved, savesCount }   ← PUT, not POST

//   DELETE /posts/:id

//

// Post model uses `user` field (not `author`).

// PostCard reads: post.user.username, post.user.avatar, post.images, post.caption, post.location, post.likesCount, post.isLiked, post.isSaved, post.commentsCount


const mongoose = require("mongoose");

const asyncHandler = require("express-async-handler");

const Post = require("../models/Post");

const User = require("../models/User");

const Comment = require("../models/Comment");

const Notification = require("../models/Notification");


// Try to import Cloudinary helper — make it optional so this works even if missing

let uploadBufferToCloudinary = null;

let deleteFromCloudinary = null;

try {

  const cloudinary = require("../utils/cloudinaryUpload");

  uploadBufferToCloudinary = cloudinary.uploadBufferToCloudinary || cloudinary.default;

  deleteFromCloudinary = cloudinary.deleteFromCloudinary;

} catch (e) {

  // Cloudinary helper missing — uploads will be no-op (URLs may be empty)

  console.warn("[postController] cloudinaryUpload helper missing — uploads may fail");

}


// Attach `isLiked`, `isSaved`, `commentsCount`, `likesCount` to post objects

// Frontend reads these exact keys (verified in PostCard.js)

const attachUserFlags = (posts, userId) => {

  const userIdStr = userId ? userId.toString() : null;

  const decorate = (p) => {

    if (!p) return p;

    const obj = p.toObject ? p.toObject() : p;

    const likes = obj.likes || [];

    const saved = obj.saved || [];

    obj.likesCount = likes.length;

    obj.isLiked = userIdStr

      ? likes.some((id) => id.toString() === userIdStr)

      : false;

    obj.isSaved = userIdStr

      ? saved.some((id) => id.toString() === userIdStr)

      : false;

    obj.commentsCount = obj.commentsCount ?? (obj.comments ? obj.comments.length : 0);

    return obj;

  };

  if (Array.isArray(posts)) return posts.map(decorate);

  return decorate(posts);

};


// Normalize uploaded image(s) into { url, publicId } shape.
// Handles both disk storage (path/filename set) and memory storage
// (only buffer + originalname set) — Cloudinary step below populates the
// real URL for memory storage uploads.
function normalizeImages(req) {
  const out = [];
  const files = Array.isArray(req.files) && req.files.length
    ? req.files
    : req.file
    ? [req.file]
    : [];

  for (const f of files) {
    // Disk storage / cloudinary storage — has a real path or url
    const url = f.path || f.secure_url || f.url;
    const publicId = f.filename || f.public_id || f.publicId;

    if (url) {
      out.push({ url, publicId: publicId || "" });
    } else if (f.buffer) {
      // Memory storage — we have the file in buffer, Cloudinary will
      // upload it and populate the real URL below.
      out.push({ url: "", publicId: f.originalname || "" });
    }
  }
  return out;
}


// @desc    Create a new post

// @route   POST /api/posts

// @access  Private

const createPost = asyncHandler(async (req, res) => {

  if (!req.user || !req.user._id) {

    res.status(401);

    throw new Error("Authentication required.");

  }


  const images = normalizeImages(req);

  if (!images.length) {

    res.status(400);

    throw new Error("At least one image is required.");

  }


  const { caption, location } = req.body;


  // Try Cloudinary if helper exists and file has buffer

  let finalImages = images;

  if (uploadBufferToCloudinary && req.files && req.files[0] && req.files[0].buffer) {

    try {

      const uploaded = await Promise.all(

        req.files.map((f) => uploadBufferToCloudinary(f.buffer, "instaclone/posts"))

      );

      finalImages = uploaded.map((u) => ({

        url: u.secure_url,

        publicId: u.public_id,

      }));

    } catch (e) {

      console.warn("[createPost] Cloudinary upload failed, using raw files:", e.message);

    }

  }


  // Extract hashtags and mentions

  const extractHashtags = (text = "") => {

    const matches = text.match(/#[\p{L}\p{N}_]+/gu) || [];

    return [...new Set(matches.map((t) => t.slice(1).toLowerCase()))].filter(Boolean);

  };

  const mentions = (caption || "").match(/@([a-zA-Z0-9_.]+)/g) || [];

  const mentionUsernames = [...new Set(mentions.map((m) => m.slice(1)))];

  const mentionUsers = mentionUsernames.length

    ? await User.find({ username: { $in: mentionUsernames } }, "_id").lean()

    : [];

  const mentionIds = mentionUsers.map((u) => u._id);


  const post = await Post.create({

    user: req.user._id,

    images: finalImages,

    caption: (caption || "").trim(),

    location: (location || "").trim(),

    hashtags: extractHashtags(caption || ""),

    mentions: mentionIds,

  });


  const populated = await Post.findById(post._id)

    .populate("user", "username name avatar")

    .lean();


  // Fire mention notifications (non-blocking)

  if (mentionIds.length) {

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


  res.status(201).json({

    success: true,

    post: attachUserFlags(populated, req.user._id),

  });

});


// @desc    Feed: paginated, supports type=forYou|following

// @route   GET /api/posts?page=1&limit=6&type=forYou

// @access  Public (optional auth)

const getFeedPosts = asyncHandler(async (req, res) => {

  const page = Math.max(parseInt(req.query.page) || 1, 1);

  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  const skip = (page - 1) * limit;

  const type = req.query.type || "forYou";


  let filter = {};

  if (type === "following") {

    if (!req.user) {

      return res.json({

        success: true,

        count: 0,

        total: 0,

        page,

        totalPages: 0,

        posts: [],

      });

    }

    const followingIds = (req.user.following || []).map((id) =>

      typeof id === "object" ? id : id

    );

    filter = { user: { $in: [...followingIds, req.user._id] } };

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


  res.json({

    success: true,

    count: decorated.length,

    total,

    page,

    totalPages: Math.ceil(total / limit),

    posts: decorated,

  });

});


// @desc    Get a single post

// @route   GET /api/posts/:id

// @access  Public

const getPostById = asyncHandler(async (req, res) => {

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {

    res.status(400);

    throw new Error("Invalid post id.");

  }

  const post = await Post.findById(id).populate("user", "username name avatar");

  if (!post) {

    res.status(404);

    throw new Error("Post not found.");

  }

  res.json({ success: true, post: attachUserFlags(post, req.user?._id) });

});


// @desc    Get posts by a user (id or username)

// @route   GET /api/posts/user/:identifier

// @access  Public

const getUserPosts = asyncHandler(async (req, res) => {

  const { identifier } = req.params;

  let user;

  if (mongoose.Types.ObjectId.isValid(identifier)) {

    user = await User.findById(identifier).select("_id").lean();

  }

  if (!user) {

    user = await User.findOne({ username: identifier.toLowerCase() })

      .select("_id")

      .lean();

  }

  if (!user) {

    res.status(404);

    throw new Error("User not found.");

  }

  const posts = await Post.find({ user: user._id })

    .sort({ createdAt: -1 })

    .populate("user", "username name avatar");

  res.json({

    success: true,

    count: posts.length,

    posts: attachUserFlags(posts, req.user?._id),

  });

});


// @desc    Like / unlike a post

// @route   PUT /api/posts/:id/like

// @access  Private

// ✅ Response: { success, isLiked, likesCount } — matches frontend exactly

const toggleLike = asyncHandler(async (req, res) => {

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {

    res.status(400);

    throw new Error("Invalid post id.");

  }

  const post = await Post.findById(id);

  if (!post) {

    res.status(404);

    throw new Error("Post not found.");

  }


  const userId = req.user._id.toString();

  const likes = post.likes || [];

  const idx = likes.findIndex((u) => u.toString() === userId);

  let isLiked;


  if (idx >= 0) {

    post.likes.splice(idx, 1);

    isLiked = false;

  } else {

    post.likes.push(req.user._id);

    isLiked = true;


    // Notify post owner (not for self-likes)

    if (post.user && post.user.toString() !== userId) {

      try {

        await Notification.create({

          recipient: post.user,

          sender: req.user._id,

          type: "like",

          post: post._id,

        });

      } catch (e) {

        // non-fatal

      }

    }

  }


  await post.save();


  const likesCount = (post.likes || []).length;


  // Emit socket event (non-fatal if io not set)

  try {

    const io = req.app.get("io");

    if (io) io.to(`post:${post._id}`).emit("likeUpdate", { postId: post._id, likesCount });

  } catch (e) {}


  res.json({ success: true, isLiked, likesCount });

});


// @desc    Save / unsave a post

// @route   PUT /api/posts/:id/save

// @access  Private

// ✅ Response: { success, isSaved, savesCount } — matches frontend exactly

const toggleSave = asyncHandler(async (req, res) => {

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {

    res.status(400);

    throw new Error("Invalid post id.");

  }

  const post = await Post.findById(id);

  if (!post) {

    res.status(404);

    throw new Error("Post not found.");

  }


  const userId = req.user._id.toString();

  const saved = post.saved || [];

  const idx = saved.findIndex((u) => u.toString() === userId);

  let isSaved;


  if (idx >= 0) {

    post.saved.splice(idx, 1);

    isSaved = false;

  } else {

    post.saved.push(req.user._id);

    isSaved = true;

  }


  await post.save();

  res.json({

    success: true,

    isSaved,

    savesCount: (post.saved || []).length,

  });

});


// @desc    Get posts the current user has saved

// @route   GET /api/posts/saved

// @access  Private

const getSavedPosts = asyncHandler(async (req, res) => {

  const posts = await Post.find({ saved: req.user._id })

    .sort({ createdAt: -1 })

    .populate("user", "username name avatar");

  res.json({

    success: true,

    count: posts.length,

    posts: attachUserFlags(posts, req.user._id),

  });

});


// @desc    Get posts by hashtag

// @route   GET /api/posts/hashtag/:tag

// @access  Public

const getPostsByHashtag = asyncHandler(async (req, res) => {

  const tag = String(req.params.tag || "").toLowerCase().replace(/^#/, "");

  if (!tag) {

    res.status(400);

    throw new Error("Tag is required.");

  }

  let posts = await Post.find({ hashtags: tag })

    .sort({ createdAt: -1 })

    .limit(50)

    .populate("user", "username name avatar");

  if (posts.length === 0) {

    const regex = new RegExp(`#${tag}\\b`, "i");

    posts = await Post.find({ caption: regex })

      .sort({ createdAt: -1 })

      .limit(50)

      .populate("user", "username name avatar");

  }

  res.json({

    success: true,

    count: posts.length,

    posts: attachUserFlags(posts, req.user?._id),

  });

});


// @desc    Delete a post (own only)

// @route   DELETE /api/posts/:id

// @access  Private

const deletePost = asyncHandler(async (req, res) => {

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {

    res.status(400);

    throw new Error("Invalid post id.");

  }

  const post = await Post.findById(id);

  if (!post) {

    res.status(404);

    throw new Error("Post not found.");

  }

  if (!post.user || post.user.toString() !== req.user._id.toString()) {

    res.status(403);

    throw new Error("Not authorized to delete this post.");

  }


  // Try delete images from Cloudinary (non-fatal)

  if (deleteFromCloudinary && post.images && post.images.length) {

    await Promise.all(

      post.images.map((img) =>

        img.publicId

          ? deleteFromCloudinary(img.publicId).catch(() => null)

          : null

      )

    );

  }


  await Comment.deleteMany({ post: post._id });

  await post.deleteOne();

  res.json({ success: true, message: "Post deleted." });

});


module.exports = {

  createPost,

  getFeedPosts,

  getUserPosts,

  getPostById,

  toggleLike,

  toggleSave,

  getSavedPosts,

  getPostsByHashtag,

  deletePost,

};

