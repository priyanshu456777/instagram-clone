/* eslint-disable no-console */
const Reel = require("../models/Reel");
const User = require("../models/User");
const Comment = require("../models/Comment");
const mongoose = require("mongoose");

/* ---------- helpers ---------- */
function asStringId(v) {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (v.toString) return v.toString();
  return String(v);
}

function toObjectId(idLike) {
  try {
    if (mongoose.Types.ObjectId.isValid(idLike)) return new mongoose.Types.ObjectId(idLike);
  } catch (_) {}
  return null;
}

/* ---------- viewer flags ---------- */
async function attachViewerFlags(reel, viewerId) {
  if (!reel) return reel;
  const obj = reel.toObject ? reel.toObject() : { ...reel };

  let likes = [];
  if (Array.isArray(obj.likes)) likes = obj.likes;
  else if (Array.isArray(obj.likedBy)) likes = obj.likedBy;
  else if (Array.isArray(obj.likers)) likes = obj.likers;
  obj.likes = likes.map(asStringId);
  obj.likesCount = obj.likes.length;
  obj.isLiked = viewerId ? obj.likes.includes(String(viewerId)) : false;

  let ownerObj = obj.user;
  const isPopulated = ownerObj && typeof ownerObj === "object" && ownerObj.username;
  if (!isPopulated) {
    // obj.user is a raw ObjectId here (Reel.find() ran without .populate()),
    // so it must be stringified directly — a plain ObjectId has no ._id of its own.
    const ownerId = asStringId(ownerObj) || obj.userId || obj.ownerId || obj.author;
    ownerObj = null; // reset so a failed/skipped lookup never leaks the raw ObjectId into the response
    if (ownerId) {
      try {
        const u = await User.findById(ownerId).select("username name avatar").lean();
        if (u) ownerObj = { _id: u._id, username: u.username, name: u.name, avatar: u.avatar };
      } catch (_) { ownerObj = null; }
    }
  }
  obj.user = ownerObj || null;

  obj.isFollowing = false;
  if (viewerId && obj.user?._id && String(obj.user._id) !== String(viewerId)) {
    try {
      const viewer = await User.findById(viewerId).select("following").lean();
      if (viewer && Array.isArray(viewer.following)) {
        obj.isFollowing = viewer.following.map(asStringId).includes(asStringId(obj.user._id));
      }
    } catch (_) {}
  }
  return obj;
}

/* ---------- user reels (for profile page) ---------- */
async function getUserReels(req, res, next) {
  try {
    const { identifier } = req.params;
    const viewerId = req.user?._id;
    let user = null;
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
    const raw = await Reel.find({ user: user._id }).sort({ createdAt: -1 }).lean();
    const reels = await Promise.all(raw.map((r) => attachViewerFlags(r, viewerId)));
    res.json({ success: true, count: reels.length, reels });
  } catch (err) {
    next(err);
  }
}

/* ---------- feed ---------- */
async function getReelsFeed(req, res, next) {
  try {
    const viewerId = req.user?._id;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const raw = await Reel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const reels = await Promise.all(raw.map((r) => attachViewerFlags(r, viewerId)));

    res.json({ success: true, count: reels.length, reels });
  } catch (err) {
    next(err);
  }
}

/* ---------- create ---------- */
async function createReel(req, res, next) {
  try {
    const file = req.file || (Array.isArray(req.files) ? req.files[0] : null);
    if (!file) return res.status(400).json({ success: false, error: "Video file required" });
    if (!file.buffer) {
      return res.status(500).json({ success: false, error: "Upload storage misconfigured (no buffer)" });
    }

    const { uploadVideoToCloudinary } = require("../utils/cloudinaryVideoUpload");
    let uploaded;
    try {
      uploaded = await uploadVideoToCloudinary(file.buffer, "instaclone/reels");
    } catch (uploadErr) {
      console.error("[createReel] Cloudinary video upload failed:", uploadErr.message);
      return res.status(502).json({ success: false, error: "Video upload failed. Please try again." });
    }

    const eagerThumb = uploaded.eager?.[0]?.secure_url || "";

    const reel = await Reel.create({
      user: req.user._id,
      caption: (req.body.caption || "").trim(),
      videoUrl: uploaded.secure_url,
      videoPublicId: uploaded.public_id,
      thumbnailUrl: req.body.thumbnailUrl || eagerThumb,
      duration: Number(req.body.duration) || uploaded.duration || 0,
    });

    res.status(201).json({ success: true, reel: await attachViewerFlags(reel, req.user._id) });
  } catch (err) {
    next(err);
  }
}

/* ---------- like (raw + defensive) ---------- */
async function likeReel(req, res, next) {
  try {
    const reelId = req.params.id;
    const userId = String(req.user._id);

    let reel = null;
    try { reel = await Reel.findById(reelId); } catch (_) {}

    let likes = [];
    if (reel && Array.isArray(reel.likes)) likes = reel.likes.map(asStringId);
    else if (reel && Array.isArray(reel.likedBy)) likes = reel.likedBy.map(asStringId);

    const idx = likes.indexOf(userId);
    let isLiked;
    if (idx >= 0) { likes.splice(idx, 1); isLiked = false; }
    else { likes.push(userId); isLiked = true; }

    let saved = false;
    if (reel) {
      try { reel.likes = likes; await reel.save(); saved = true; } catch (_) {}
    }
    if (!saved) {
      try {
        await Reel.updateOne({ _id: reelId }, { $set: { likes } });
        saved = true;
      } catch (_) {}
    }
    if (!saved && mongoose.connection.readyState === 1) {
      try {
        const oid = toObjectId(reelId) || reelId;
        const coll = mongoose.connection.db.collection("reels");
        await coll.updateOne({ _id: oid }, { $set: { likes } });
        saved = true;
      } catch (e) { console.error("[likeReel] raw update failed:", e.message); }
    }

    res.json({ success: true, isLiked, likesCount: likes.length, persisted: saved });
  } catch (err) {
    next(err);
  }
}

/* ---------- delete ---------- */
async function deleteReel(req, res, next) {
  try {
    const reel = await Reel.findById(req.params.id);
    if (!reel) return res.status(404).json({ success: false, error: "Reel not found" });
    if (String(reel.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, error: "Not authorized" });
    }

    if (reel.videoPublicId) {
      const { deleteVideoFromCloudinary } = require("../utils/cloudinaryVideoUpload");
      await deleteVideoFromCloudinary(reel.videoPublicId).catch(() => null);
    }

    await Comment.deleteMany({ targetType: "reel", targetId: reel._id }).catch(() => null);

    await reel.deleteOne();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getReelsFeed,
  getUserReels,
  createReel,
  likeReel,
  deleteReel,
};