// backend/controllers/userController.js

// ✅ FIX: Added `toggleSavePost` and `getSavedPosts` (kept here to match userRoutes.js imports)

// ✅ FIX: `postsCount` nested inside `user` object (frontend ProfileHeader reads from there)

//

// userRoutes.js imports: { getProfile, updateProfile, updateAvatar, toggleFollow, toggleSavePost, getSavedPosts, searchUsers }

// We export all of them to keep userRoutes.js from crashing.


const mongoose = require("mongoose");

const asyncHandler = require("express-async-handler");

const User = require("../models/User");

const Post = require("../models/Post");

const Notification = require("../models/Notification");


let uploadBufferToCloudinary = null;

let deleteFromCloudinary = null;

try {

  const cu = require("../utils/cloudinaryUpload");

  uploadBufferToCloudinary = cu.uploadBufferToCloudinary || cu.default;

  deleteFromCloudinary = cu.deleteFromCloudinary;

} catch (e) {}


// @desc    Get a user's public profile + posts (by username)

// @route   GET /api/users/:username

// @access  Public

const getProfile = asyncHandler(async (req, res) => {

  const username = (req.params.username || "").toLowerCase();

  const user = await User.findOne({ username })

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


  // Build a clean user object — `postsCount` is nested INSIDE user

  // (frontend ProfileHeader reads `profile.postsCount` directly)

  const userObj = user.toObject ? user.toObject() : user;

  userObj.postsCount = posts.length;

  userObj.followersCount = user.followers?.length ?? 0;

  userObj.followingCount = user.following?.length ?? 0;


  res.status(200).json({

    success: true,

    user: userObj,

    isFollowing,

    posts,

  });

});


// @desc    Update logged-in user's profile

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


// @desc    Upload / replace profile avatar

// @route   PUT /api/users/avatar

// @access  Private

const updateAvatar = asyncHandler(async (req, res) => {

  if (!req.file) {

    res.status(400);

    throw new Error("Please upload an image");

  }

  if (!uploadBufferToCloudinary) {

    res.status(500);

    throw new Error("Upload service not configured");

  }

  const user = await User.findById(req.user._id);

  if (user.avatar && user.avatar.publicId && deleteFromCloudinary) {

    await deleteFromCloudinary(user.avatar.publicId).catch(() => null);

  }

  const result = await uploadBufferToCloudinary(req.file.buffer, "instaclone/avatars");

  user.avatar = { url: result.secure_url, publicId: result.public_id };

  await user.save();

  res.status(200).json({ success: true, avatar: user.avatar });

});


// @desc    Follow / unfollow a user

// @route   PUT /api/users/:id/follow

// @access  Private

const toggleFollow = asyncHandler(async (req, res) => {

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {

    res.status(400);

    throw new Error("Invalid user id.");

  }

  if (id === req.user._id.toString()) {

    res.status(400);

    throw new Error("You cannot follow yourself");

  }

  const target = await User.findById(id);

  if (!target) {

    res.status(404);

    throw new Error("User not found");

  }

  const me = await User.findById(req.user._id);

  const targetIdStr = target._id.toString();

  const myIdStr = me._id.toString();

  const idx = (me.following || []).findIndex((u) => u.toString() === targetIdStr);

  let isFollowing;

  if (idx >= 0) {

    me.following.splice(idx, 1);

    target.followers = (target.followers || []).filter(

      (u) => u.toString() !== myIdStr

    );

    isFollowing = false;

  } else {

    me.following.push(target._id);

    target.followers.push(me._id);

    isFollowing = true;

    try {

      await Notification.create({

        recipient: target._id,

        sender: me._id,

        type: "follow",

      });

    } catch (e) {}

  }

  await me.save();

  await target.save();

  res.json({

    success: true,

    isFollowing,

    followersCount: (target.followers || []).length,

  });

});


// ============================================================

//  Added to satisfy userRoutes.js imports (legacy routes)

//  These are NOT used by the current frontend (which uses

//  /api/posts/:id/save and /api/posts/saved instead) but the

//  user router still imports them — keep them as functional

//  so the server doesn't crash on startup.

// ============================================================


// @desc    Toggle save on a post (legacy user-routes endpoint)

// @route   PUT /api/users/save/:postId

// @access  Private

const toggleSavePost = asyncHandler(async (req, res) => {

  const { postId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(postId)) {

    res.status(400);

    throw new Error("Invalid post id.");

  }

  const post = await Post.findById(postId);

  if (!post) {

    res.status(404);

    throw new Error("Post not found");

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


// @desc    Get posts saved by current user (legacy user-routes endpoint)

// @route   GET /api/users/saved

// @access  Private

const getSavedPosts = asyncHandler(async (req, res) => {

  const posts = await Post.find({ saved: req.user._id })

    .sort({ createdAt: -1 })

    .populate("user", "username name avatar");

  res.json({

    success: true,

    count: posts.length,

    posts,

  });

});


// @desc    Search users

// @route   GET /api/users/search/:query  OR  GET /api/users/search?q=

// @access  Public

const searchUsers = asyncHandler(async (req, res) => {

  const q = (req.query.q || req.params.query || "").trim();

  if (!q) {

    return res.json({ success: true, count: 0, users: [] });

  }

  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const users = await User.find({

    $or: [{ username: regex }, { name: regex }],

  })

    .select("username name avatar isVerified")

    .limit(20)

    .lean();

  res.json({ success: true, count: users.length, users });

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

