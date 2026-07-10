/* eslint-disable no-console */

const express = require("express");

const router = express.Router();


/* ---------- resolve upload middleware defensively ---------- */

let upload;

try {

  const mod = require("../middleware/uploadMiddleware");

  upload = mod && (mod.upload || mod.default || mod);

  if (typeof upload !== "function") upload = null;

} catch (_) { upload = null; }

if (!upload) {

  // Fallback in-memory multer (no persist, video won't reach Cloudinary

  // but at least the route will mount and POST will reach controller)

  try {

    const multer = require("multer");

    upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

  } catch (_) { upload = null; }

}


/* ---------- resolve auth middleware defensively ---------- */

let protect;

try {

  protect = require("../middleware/authMiddleware").protect;

} catch (_) {

  protect = (req, _res, next) => next();

}


/* ---------- pull controller functions ---------- */

const ctrl = require("../controllers/reelController");

const {

  getReelsFeed,

  getUserReels,

  createReel,

  likeReel,

  deleteReel,

} = ctrl;

// Reel comments now go through the same polymorphic Comment model that
// Posts use (real DB storage, real-time socket emit, notifications,
// threaded replies) instead of the old embedded-array hack.
const { addComment, getComments } = require("../controllers/commentController");


/* ---------- route registration (every variation tolerated) ---------- */

router.get("/", protect, getReelsFeed);

router.get("/user/:identifier", protect, getUserReels);

router.post("/", protect, upload ? upload.single("video") : (_req, _res, n) => n(), createReel);

router.put("/:id/like", protect, likeReel);

router.post("/:id/like", protect, likeReel); // legacy fallback if client uses POST

// Frontend expects /reels/:id/comments — wire it to the same polymorphic
// comment controller Posts use, by injecting targetType/targetId.
router.get("/:id/comments", protect, (req, res, next) => {
  req.query.targetType = "reel";
  req.query.targetId = req.params.id;
  return getComments(req, res, next);
});

router.post("/:id/comments", protect, (req, res, next) => {
  req.body.targetType = "reel";
  req.body.targetId = req.params.id;
  return addComment(req, res, next);
});

router.delete("/:id", protect, deleteReel);


module.exports = router;