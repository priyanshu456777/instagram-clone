/* eslint-disable no-console */

const Reel = require("../models/Reel");

const User = require("../models/User");

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

  if (!ownerObj || typeof ownerObj !== "object" || !ownerObj.username) {

    const ownerId = obj.user?._id || obj.userId || obj.ownerId || obj.author;

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


    const reel = await Reel.create({

      user: req.user._id,

      caption: (req.body.caption || "").trim(),

      videoUrl: file.path,

      thumbnailUrl: req.body.thumbnailUrl || "",

      duration: Number(req.body.duration) || 0,

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


/* ============================================================

   COMMENTS — entry log at the very top, native MongoDB driver

   ============================================================ */


async function getReelComments(req, res) {

  console.log("[getReelComments] ENTRY", { reelId: req.params.id, userId: req.user?._id });


  try {

    const reelId = req.params.id;


    // Native-only read

    if (mongoose.connection.readyState !== 1) {

      console.error("[getReelComments] mongoose not connected");

      return res.status(500).json({ success: false, error: "DB not ready" });

    }

    const coll = mongoose.connection.db.collection("reels");

    const oid = toObjectId(reelId);

    if (!oid) {

      console.error("[getReelComments] invalid reelId");

      return res.status(400).json({ success: false, error: "Invalid reel id" });

    }

    const reel = await coll.findOne({ _id: oid });

    if (!reel) {

      console.error("[getReelComments] reel not found");

      return res.status(404).json({ success: false, error: "Reel not found" });

    }


    let comments = Array.isArray(reel.comments) ? reel.comments : [];

    console.log("[getReelComments] found", comments.length, "comments");


    const needRefIds = comments

      .filter((c) => !(c.userSnapshot && c.userSnapshot.username))

      .map((c) => (c.userSnapshot && c.userSnapshot._id) || c.user)

      .filter(Boolean)

      .map(asStringId);


    let refMap = new Map();

    if (needRefIds.length) {

      const oidList = needRefIds.map((s) => toObjectId(s)).filter(Boolean);

      if (oidList.length) {

        const users = await mongoose.connection.db.collection("users")

          .find({ _id: { $in: oidList } })

          .project({ username: 1, name: 1, avatar: 1 })

          .toArray();

        refMap = new Map(users.map((u) => [String(u._id), u]));

      }

    }


    const hydrated = comments.map((c) => {

      let user = c.userSnapshot || null;

      if (!user || !user.username) {

        const refId = asStringId(c.user);

        if (refId && refMap.has(refId)) {

          const u = refMap.get(refId);

          user = { _id: u._id, username: u.username, name: u.name, avatar: u.avatar };

        }

      }

      return {

        _id: c._id || String(Math.random()),

        text: c.text || "",

        user,

        createdAt: c.createdAt || new Date(),

      };

    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));


    res.json({ success: true, comments: hydrated });

  } catch (err) {

    console.error("[getReelComments] ERROR:", err.message, err.stack);

    res.status(500).json({ success: false, error: err.message });

  }

}


async function addReelComment(req, res) {

  console.log("[addReelComment] ENTRY", {

    reelId: req.params.id,

    userId: req.user?._id,

    hasUser: !!req.user,

    text: (req.body.text || "").slice(0, 50),

  });


  try {

    /* ---- validate ---- */

    const reelId = req.params.id;

    const userId = req.user?._id || req.user?.id;

    const text = (req.body.text || "").trim();


    if (!text) {

      console.error("[addReelComment] empty text");

      return res.status(400).json({ success: false, error: "Comment text required" });

    }

    if (!userId) {

      console.error("[addReelComment] no userId on req.user");

      return res.status(401).json({ success: false, error: "Not authenticated" });

    }


    const oid = toObjectId(reelId);

    if (!oid) {

      console.error("[addReelComment] invalid reelId:", reelId);

      return res.status(400).json({ success: false, error: "Invalid reel id" });

    }


    if (mongoose.connection.readyState !== 1) {

      console.error("[addReelComment] mongoose not connected, readyState:", mongoose.connection.readyState);

      return res.status(500).json({ success: false, error: "DB not ready" });

    }


    /* ---- verify reel exists via native ---- */

    const reelsColl = mongoose.connection.db.collection("reels");

    const reel = await reelsColl.findOne({ _id: oid });

    if (!reel) {

      console.error("[addReelComment] reel not found:", reelId);

      return res.status(404).json({ success: false, error: "Reel not found" });

    }


    /* ---- hydrate user ---- */

    let userObj = { _id: userId, username: "user", name: "", avatar: null };

    try {

      const userOid = toObjectId(userId);

      if (userOid) {

        const u = await mongoose.connection.db.collection("users")

          .findOne({ _id: userOid }, { projection: { username: 1, name: 1, avatar: 1 } });

        if (u) userObj = { _id: u._id, username: u.username, name: u.name, avatar: u.avatar };

      }

    } catch (_) {}


    /* ---- build comment ---- */

    const newComment = {

      _id: new mongoose.Types.ObjectId().toString(),

      user: userId,

      userSnapshot: userObj,

      text,

      createdAt: new Date(),

    };


    console.log("[addReelComment] attempting $push to reel", reelId);


    /* ---- pure native $push ---- */

    const result = await reelsColl.updateOne(

      { _id: oid },

      { $push: { comments: newComment } }

    );


    console.log("[addReelComment] native $push result:", {

      matched: result.matchedCount,

      modified: result.modifiedCount,

    });


    if (result.matchedCount === 0) {

      console.error("[addReelComment] updateOne matched 0 docs!");

      return res.status(500).json({ success: false, error: "Reel not found during update" });

    }


    return res.status(201).json({

      success: true,

      comment: { ...newComment, user: userObj },

    });

  } catch (err) {

    console.error("[addReelComment] OUTER ERROR:", err.message);

    console.error(err.stack);

    return res.status(500).json({

      success: false,

      error: err.message,

      type: err.name,

    });

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

    await reel.deleteOne();

    res.json({ success: true });

  } catch (err) {

    next(err);

  }

}


module.exports = {

  getReelsFeed,

  createReel,

  likeReel,

  getReelComments,

  addReelComment,

  deleteReel,

};

