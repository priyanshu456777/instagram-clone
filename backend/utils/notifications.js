// backend/utils/notifications.js
// Small shared helper for creating a Notification doc from any controller.
// This file didn't exist before — commentController.js was requiring it
// inside a try/catch and silently falling back to a no-op when the require
// failed, so comment/reply notifications were never actually created.

const Notification = require("../models/Notification");

/**
 * Create a notification and (optionally) push it over the socket.
 *
 * @param {Object} opts
 * @param {String|ObjectId} opts.recipient - who receives the notification
 * @param {String|ObjectId} opts.sender    - who triggered it
 * @param {String} opts.type - "like" | "comment" | "reply" | "follow" | "mention" | "story_like" | "story_reply"
 * @param {"post"|"reel"|"story"} [opts.targetType] - what the notification is about
 * @param {String|ObjectId} [opts.targetId] - id of the post/reel/story
 * @param {Object} [opts.io] - socket.io server instance, e.g. req.app.get("io")
 */
async function createNotification({ recipient, sender, type, targetType, targetId, io }) {
  if (!recipient || !sender || !type) return null;

  // Never notify people about their own actions.
  if (String(recipient) === String(sender)) return null;

  const payload = { recipient, sender, type };
  if (targetType === "post" && targetId) payload.post = targetId;
  else if (targetType === "reel" && targetId) payload.reel = targetId;
  else if (targetType === "story" && targetId) payload.story = targetId;

  const notification = await Notification.create(payload);
  const populated = await notification.populate("sender", "username name avatar");

  if (io) {
    io.to(String(recipient)).emit("newNotification", populated);
  }

  return populated;
}

module.exports = { createNotification };