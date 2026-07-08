const asyncHandler = require("express-async-handler");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const User = require("../models/User");
const {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} = require("../utils/cloudinaryUpload");

// Pull all #hashtags from a caption. Lowercased + deduped so a caption like
// "#Travel #travel #TRAVEL" only stores one entry.
const extractHashtags = (text) => {
  if (!text) return [];
  const matches = text.match(/#[\p{L}\p{N}_]+/gu) || [];
  return [...new Set(matches.map((h) => h.slice(1).toLowerCase()))];
};

// Pull all @mentions. We resolve them to ObjectIds against the User collection
// so we can later send a "you were mentioned in a post" notification.
const extractMentions = async (text) => {
  if (!text) return [];
  const matches = text.match(/@[a-z0-9._]+/gi) || [];
  if (matches.length === 0) return [];
  const usernames = [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
  const users = await User.find({ username: { $in: usernames } })
    .select("_id username")
    .lean();
  return users.map((u) => u._id);
};

// @desc Create a new post (supports carousel — multiple images)
// @route POST /api/posts
// @access Private
const createPost = asyncHandler(async (req, res) => {
  // upload.array("images", 10) — max 10 images per post (matches Instagram's limit)
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("Please upload at least one image for the post");
  }
  if (req.files.length > 10) {
    res.status(400);
    throw new Error("You can upload up to 10 images per post");
  }

  const { caption, location } = req.body;

  // Upload all images to Cloudinary in parallel — much faster than serial upload
  const uploadResults = await Promise.all(
    req.files.map((file) => uploadBufferToCloudinary(file.buffer, "instaclone/posts"))
  );

  // Parse hashtags + mentions out of the caption at write time so we don't
  // have to regex-scan every caption at query time later.
  const hashtags = extractHashtags(caption);
  const mentions = await extractMentions(caption);

  const post = await Post.create({
    user: req.user._id,
    images: uploadResults.map((r) => ({
      url: r.secure_url,
      publicId: r.public_id,
    })),
    caption: caption || "",
    location: location || "",
    hashtags,
    mentions,
  });

  const populatedPost = await Post.findById(post._id).populate(
    "user",
    "username name avatar"
  );

  // Fire mention notifications in the background — don't block the response
  // waiting on notification writes.
  if (mentions.length > 0) {
    Promise.all(
      mentions.map((recipientId) =>
        Notification.create({
          recipient: recipientId,
          sender: req.user._id,
          type: "mention",
          post: post._id,
        })
      )
    ).catch((err) => console.error("Failed to create mention notifications:", err));
  }

  res.status(201).json({ success: true, post: populatedPost });
});

// @desc Get paginated feed (newest first) — "following" or "forYou" mode
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

// @desc Get posts by hashtag
// @route GET /api/posts/hashtag/:tag?page=1&limit=10
// @access Public
const getPostsByHashtag = asyncHandler(async (req, res) => {
  const tag = req.params.tag.toLowerCase().replace(/^#/, "");
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 12, 50);
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find({ hashtags: tag })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username name avatar"),
    Post.countDocuments({ hashtags: tag }),
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
    tag,
    count: posts.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    posts: postsWithLikeStatus,
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
  const obj = post.toObject();
  obj.isLiked = req.user
    ? post.likes.some((id) => id.toString() === req.user._id.toString())
    : false;
  res.status(200).json({ success: true, post: obj });
});

// @desc Get all posts by a specific user (for profile page)
// @route GET /api/posts/user/:userId
// @access Public
const getPostsByUser = asyncHandler(async (req, res) => {
  const posts = await Post.find({ user: req.params.userId })
    .sort({ createdAt: -1 })
    .populate("user", "username name avatar");
  res.status(200).json({ success: true, count: posts.length, posts });
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
  // Delete every image from Cloudinary (carousel posts can have many)
  await Promise.all(
    (post.images || []).map((img) => deleteFromCloudinary(img.publicId))
  );
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

module.exports = {
  createPost,
  getFeed,
  getPost,
  getPostsByUser,
  getPostsByHashtag,
  deletePost,
  toggleLike,
};