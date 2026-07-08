const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");

// @desc    Get all notifications for logged-in user (newest first)
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("sender", "username name avatar")
    .populate("post", "image")
    .populate("story", "image");

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    read: false,
  });

  res.status(200).json({ success: true, notifications, unreadCount });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.status(200).json({ success: true, message: "All notifications marked as read" });
});

module.exports = { getNotifications, markAllAsRead };