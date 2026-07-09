// backend/routes/reelRoutes.js — NEW FILE.


const express = require("express");

const {

  createReel,

  getReelsFeed,

  getReel,

  deleteReel,

  toggleReelLike,

  viewReel,

} = require("../controllers/reelController");

const { protect, optionalAuth } = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");


const router = express.Router();


// IMPORTANT: static routes before dynamic "/:id"

router.get("/", optionalAuth, getReelsFeed);

router.get("/:id", optionalAuth, getReel);

router.post("/", protect, upload.single("video"), createReel);

router.delete("/:id", protect, deleteReel);

router.put("/:id/like", protect, toggleReelLike);

router.post("/:id/view", optionalAuth, viewReel);


module.exports = router;

