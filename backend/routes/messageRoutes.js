const express = require("express");
const {
  getConversations,
  getMessages,
  sendMessage,
  replyToStory,
} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/conversations", protect, getConversations);
router.get("/conversations/:id", protect, getMessages);
router.post("/send", protect, sendMessage);
router.post("/story-reply", protect, replyToStory);

module.exports = router;