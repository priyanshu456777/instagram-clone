const express = require("express");
const {
  createStory,
  getStories,
  viewStory,
  toggleLikeStory,
  getStorySeenBy,
  deleteStory,
} = require("../controllers/storyController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.route("/").get(protect, getStories).post(protect, upload.single("image"), createStory);
router.post("/:id/view", protect, viewStory);
router.post("/:id/like", protect, toggleLikeStory);
router.get("/:id/seen-by", protect, getStorySeenBy);
router.delete("/:id", protect, deleteStory);

module.exports = router;