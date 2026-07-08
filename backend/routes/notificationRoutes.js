const express = require("express");
const { getNotifications, markAllAsRead } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/read", protect, markAllAsRead);

module.exports = router;
