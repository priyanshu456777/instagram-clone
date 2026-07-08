const express = require("express");
const {
  getProfile,
  updateProfile,
  updateAvatar,
  toggleFollow,
  toggleSavePost,
  getSavedPosts,
  searchUsers,
} = require("../controllers/userController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// NOTE: specific routes must come before the dynamic "/:username" route
router.get("/search/:query", searchUsers);
router.get("/saved", protect, getSavedPosts);
router.put("/profile", protect, updateProfile);
router.put("/avatar", protect, upload.single("avatar"), updateAvatar);
router.put("/:id/follow", protect, toggleFollow);
router.put("/save/:postId", protect, toggleSavePost);
router.get("/:username", optionalAuth, getProfile);

module.exports = router;
