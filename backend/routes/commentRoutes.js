// backend/routes/commentRoutes.js

// Polymorphic comment routes — same router handles post + reel comments

// Already wired up in server.js via app.use("/api/comments", require("./routes/commentRoutes"))


const express = require("express");

const router = express.Router();


const {

  addComment,

  getComments,

  deleteComment,

  toggleCommentLike,

} = require("../controllers/commentController");


// If you have an auth middleware, swap this import to match your project

// e.g. const { protect } = require("../middleware/authMiddleware");

const { protect } = require("../middleware/authMiddleware");


// Add a comment (post or reel, or reply to a comment)

router.post("/", protect, addComment);


// List comments for a target

// Example: GET /api/comments?targetType=reel&targetId=...

router.get("/", getComments);


// Like/unlike

router.post("/:id/like", protect, toggleCommentLike);


// Delete own comment

router.delete("/:id", protect, deleteComment);


module.exports = router;

