// backend/controllers/reelController.js — NEW FILE.


const asyncHandler = require("express-async-handler");

const Reel = require("../models/Reel");

const Notification = require("../models/Notification");

const {

  uploadVideoToCloudinary,

  deleteVideoFromCloudinary,

} = require("../utils/cloudinaryVideoUpload");


const extractHashtags = (text = "") => {

  const matches = text.match(/#[\p{L}\p{N}_]+/gu) || [];

  return [...new Set(matches.map((t) => t.slice(1).toLowerCase()))].filter(Boolean);

};


const extractMentions = async (text = "") => {

  const matches = text.match(/@([a-zA-Z0-9_.]+)/g) || [];

  const usernames = [...new Set(matches.map((m) => m.slice(1)))];

  if (!usernames.length) return [];

  const User = require("../models/User");

  const users = await User.find({ username: { $in: usernames } }, "_id");

  return users.map((u) => u._id);

};


const attachUserFlags = (reels, userId) => {

  if (!Array.isArray(reels)) {

    if (!reels) return reels;

    const obj = reels.toObject ? reels.toObject() : reels;

    obj.isLiked = userId

      ? (obj.likes || []).some((id) => id.toString() === userId.toString())

      : false;

    obj.isViewed = userId

      ? (obj.viewedBy || []).some((id) => id.toString() === userId.toString())

      : false;

    return obj;

  }

  return reels.map((r) => {

    const obj = r.toObject ? r.toObject() : r;

    obj.isLiked = userId

      ? (obj.likes || []).some((id) => id.toString() === userId.toString())

      : false;

    obj.isViewed = userId

      ? (obj.viewedBy || []).some((id) => id.toString() === userId.toString())

      : false;

    return obj;

  });

};


// @desc Create a new reel

// @route POST /api/reels

// @access Private

const createReel = asyncHandler(async (req, res) => {

  if (!req.file) {

    res.status(400);

    throw new Error("Please upload a video file");

  }


  const { caption, audio } = req.body;

  if (!caption || !caption.trim()) {

    res.status(400);

    throw new Error("Caption is required for reels");

  }


  // Use multer file size limit as the implicit cap (50MB).

  const result = await uploadVideoToCloudinary(req.file.buffer, "instaclone/reels");

  const thumbnailUrl = result.eager?.[0]?.secure_url || "";


  const hashtags = extractHashtags(caption);

  const mentionIds = await extractMentions(caption);


  const reel = await Reel.create({

    user: req.user._id,

    videoUrl: result.secure_url,

    videoPublicId: result.public_id,

    thumbnailUrl,

    thumbnailPublicId: result.eager?.[0]?.public_id || "",

    caption: caption.trim(),

    duration: result.duration || 0,

    audio: audio || "",

    hashtags,

    mentions: mentionIds,

  });


  const populated = await Reel.findById(reel._id).populate(

    "user",

    "username name avatar"

  );


  res.status(201).json({ success: true, reel: populated });

});


// @desc Get reels feed (paginated)

// @route GET /api/reels?page=1&limit=10

// @access Public

const getReelsFeed = asyncHandler(async (req, res) => {

  const page = Math.max(parseInt(req.query.page) || 1, 1);

  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  const skip = (page - 1) * limit;


  const [reels, total] = await Promise.all([

    Reel.find()

      .sort({ createdAt: -1 })

      .skip(skip)

      .limit(limit)

      .populate("user", "username name avatar"),

    Reel.countDocuments(),

  ]);


  const decorated = attachUserFlags(reels, req.user?._id);


  res.status(200).json({

    success: true,

    count: decorated.length,

    total,

    page,

    totalPages: Math.ceil(total / limit),

    reels: decorated,

  });

});


// @desc Get a single reel by id

// @route GET /api/reels/:id

// @access Public

const getReel = asyncHandler(async (req, res) => {

  const reel = await Reel.findById(req.params.id).populate(

    "user",

    "username name avatar"

  );

  if (!reel) {

    res.status(404);

    throw new Error("Reel not found");

  }

  res.status(200).json({ success: true, reel: attachUserFlags(reel, req.user?._id) });

});


// @desc Delete a reel (owner only)

// @route DELETE /api/reels/:id

// @access Private

const deleteReel = asyncHandler(async (req, res) => {

  const reel = await Reel.findById(req.params.id);

  if (!reel) {

    res.status(404);

    throw new Error("Reel not found");

  }

  if (reel.user.toString() !== req.user._id.toString()) {

    res.status(403);

    throw new Error("Not authorized");

  }

  await deleteVideoFromCloudinary(reel.videoPublicId);

  if (reel.thumbnailPublicId) {

    await deleteVideoFromCloudinary(reel.thumbnailPublicId).catch(() => null);

  }

  await reel.deleteOne();

  res.status(200).json({ success: true });

});


// @desc Like / unlike a reel (toggle)

// @route PUT /api/reels/:id/like

// @access Private

const toggleReelLike = asyncHandler(async (req, res) => {

  const reel = await Reel.findById(req.params.id);

  if (!reel) {

    res.status(404);

    throw new Error("Reel not found");

  }

  const userId = req.user._id.toString();

  const alreadyLiked = (reel.likes || []).some((id) => id.toString() === userId);


  if (alreadyLiked) {

    reel.likes = reel.likes.filter((id) => id.toString() !== userId);

  } else {

    reel.likes.push(req.user._id);

    if (reel.user.toString() !== userId) {

      await Notification.create({

        recipient: reel.user,

        sender: req.user._id,

        type: "reel_like",

        reel: reel._id,

      }).catch(() => null);

      const io = req.app.get("io");

      io?.to(reel.user.toString())?.emit?.("newNotification", {

        type: "reel_like",

        from: {

          _id: req.user._id,

          username: req.user.username,

          avatar: req.user.avatar,

        },

        reelId: reel._id,

        createdAt: new Date(),

      });

    }

  }


  await reel.save();

  res.status(200).json({

    success: true,

    isLiked: !alreadyLiked,

    likesCount: reel.likes.length,

  });

});


// @desc Record a view (increments once per user)

// @route POST /api/reels/:id/view

// @access Private (optional — works without auth but does nothing for guests)

const viewReel = asyncHandler(async (req, res) => {

  if (!req.user) return res.status(200).json({ success: true, viewed: false });

  const reel = await Reel.findById(req.params.id);

  if (!reel) {

    res.status(404);

    throw new Error("Reel not found");

  }

  const userId = req.user._id.toString();

  const alreadyViewed = (reel.viewedBy || []).some((id) => id.toString() === userId);

  if (!alreadyViewed) {

    reel.viewedBy.push(req.user._id);

    reel.viewsCount = (reel.viewsCount || 0) + 1;

    await reel.save();

  }

  res.status(200).json({

    success: true,

    viewed: true,

    viewsCount: reel.viewsCount,

  });

});


module.exports = {

  createReel,

  getReelsFeed,

  getReel,

  deleteReel,

  toggleReelLike,

  viewReel,

};

