// backend/routes/postRoutes.js — REPLACE existing file.
// Added: PUT /:id/save (bookmark), GET /saved (saved posts feed).

const express = require("express");
const {
  createPost,
  getFeed,
  getPost,
  getPostsByUser,
  getPostsByHashtag,
  deletePost,
  toggleLike,
  toggleSave,
  getSavedPosts,
} = require("../controllers/postController");
const {
  addComment,
  getComments,
} = require("../controllers/commentController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { commentValidator } = require("../middleware/validators");

const router = express.Router();

// IMPORTANT: static routes MUST be declared before dynamic "/:id" —
// Express matches in declaration order, otherwise "saved" or "user"
// would be treated as a post id.
router.get("/saved", protect, getSavedPosts);
router.get("/hashtag/:tag", optionalAuth, getPostsByHashtag);
router.get("/user/:userId", getPostsByUser);

// Multer handles up to 10 files in a single request — used for carousel posts.
router
  .route("/")
  .get(optionalAuth, getFeed)
  .post(protect, upload.array("images", 10), createPost);

router
  .route("/:id")
  .get(optionalAuth, getPost)
  .delete(protect, deletePost);

router.put("/:id/like", protect, toggleLike);
router.put("/:id/save", protect, toggleSave);

router
  .route("/:id/comments")
  .get(getComments)
  .post(protect, commentValidator, addComment);

module.exports = router;