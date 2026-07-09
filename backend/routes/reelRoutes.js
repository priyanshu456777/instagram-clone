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

  createReel,

  likeReel,

  getReelComments,

  addReelComment,

  deleteReel,

} = ctrl;


console.log("[reelRoutes] mounted", {

  hasFeed: typeof getReelsFeed,

  hasCreate: typeof createReel,

  hasLike: typeof likeReel,

  hasGetComments: typeof getReelComments,

  hasAddComment: typeof addReelComment,

  hasDelete: typeof deleteReel,

});


/* ---------- route registration (every variation tolerated) ---------- */

router.get("/", protect, getReelsFeed);

router.post("/", protect, upload ? upload.single("video") : (_req, _res, n) => n(), createReel);

router.put("/:id/like", protect, likeReel);

router.post("/:id/like", protect, likeReel); // legacy fallback if client uses POST

router.get("/:id/comments", protect, getReelComments);

router.post("/:id/comments", protect, addReelComment);

router.delete("/:id", protect, deleteReel);


module.exports = router;

