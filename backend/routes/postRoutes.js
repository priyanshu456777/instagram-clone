const express = require("express");
const {
  createPost,
  getFeed,
  getPost,
  getPostsByUser,
  deletePost,
  toggleLike,
} = require("../controllers/postController");
const { addComment, getComments } = require("../controllers/commentController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { commentValidator } = require("../middleware/validators");

const router = express.Router();

router.route("/").get(optionalAuth, getFeed).post(protect, upload.single("image"), createPost);

router.get("/user/:userId", getPostsByUser);

router.route("/:id").get(optionalAuth, getPost).delete(protect, deletePost);

router.put("/:id/like", protect, toggleLike);

router
  .route("/:id/comments")
  .get(getComments)
  .post(protect, commentValidator, addComment);

module.exports = router;
