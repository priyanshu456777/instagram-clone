const express = require("express");
const {
  createPost,
  getFeed,
  getPost,
  getPostsByUser,
  getPostsByHashtag,
  deletePost,
  toggleLike,
} = require("../controllers/postController");
const {
  addComment,
  getComments,
} = require("../controllers/commentController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { commentValidator } = require("../middleware/validators");

const router = express.Router();

// IMPORTANT: static routes ("/hashtag/:tag", "/user/:userId") MUST be declared
// before the dynamic "/:id" route — Express matches in declaration order,
// otherwise "hashtag" or "user" would be treated as an ObjectId.
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
router
  .route("/:id/comments")
  .get(getComments)
  .post(protect, commentValidator, addComment);

module.exports = router;