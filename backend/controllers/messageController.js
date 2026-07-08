const asyncHandler = require("express-async-handler");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Story = require("../models/Story");
const Notification = require("../models/Notification");

// Finds an existing 1:1 conversation between two users, or creates one.
// Kept as a helper since both "send message" and "reply to story" need it.
const findOrCreateConversation = async (userId, otherUserId) => {
  let conversation = await Conversation.findOne({
    participants: { $all: [userId, otherUserId], $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, otherUserId],
    });
  }

  return conversation;
};

// @desc    Get all conversations for the logged-in user (inbox list),
//          sorted by most recent activity
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .sort({ updatedAt: -1 })
    .populate("participants", "username name avatar")
    .populate({
      path: "lastMessage",
      select: "text sender createdAt readBy storyReply",
    });

  // Attach the "other" participant + unread flag so the frontend doesn't
  // have to recompute this per row
  const result = conversations.map((c) => {
    const other = c.participants.find(
      (p) => p._id.toString() !== req.user._id.toString()
    );
    const isUnread =
      c.lastMessage &&
      c.lastMessage.sender.toString() !== req.user._id.toString() &&
      !c.lastMessage.readBy.some((id) => id.toString() === req.user._id.toString());

    return {
      _id: c._id,
      otherUser: other,
      lastMessage: c.lastMessage,
      isUnread: Boolean(isUnread),
      updatedAt: c.updatedAt,
    };
  });

  res.status(200).json({ success: true, conversations: result });
});

// @desc    Get all messages in a conversation (thread view), oldest first.
//          Also marks all unread messages in this thread as read.
// @route   GET /api/messages/conversations/:id
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    res.status(404);
    throw new Error("Conversation not found");
  }

  const isParticipant = conversation.participants.some(
    (id) => id.toString() === req.user._id.toString()
  );
  if (!isParticipant) {
    res.status(403);
    throw new Error("Not authorized to view this conversation");
  }

  const messages = await Message.find({ conversation: conversation._id })
    .sort({ createdAt: 1 })
    .populate("sender", "username name avatar");

  await Message.updateMany(
    {
      conversation: conversation._id,
      sender: { $ne: req.user._id },
      readBy: { $ne: req.user._id },
    },
    { $addToSet: { readBy: req.user._id } }
  );

  res.status(200).json({ success: true, messages });
});

// @desc    Send a plain text message to another user (creates conversation if needed)
// @route   POST /api/messages/send
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { recipientId, text } = req.body;

  if (!recipientId || !text?.trim()) {
    res.status(400);
    throw new Error("recipientId and text are required");
  }
  if (recipientId === req.user._id.toString()) {
    res.status(400);
    throw new Error("Cannot message yourself");
  }

  const conversation = await findOrCreateConversation(req.user._id, recipientId);

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    text: text.trim(),
    readBy: [req.user._id],
  });

  conversation.lastMessage = message._id;
  await conversation.save();

  const populatedMessage = await message.populate("sender", "username name avatar");

  // Real-time delivery to the recipient if they're online
  const io = req.app.get("io");
  io.to(recipientId).emit("newMessage", {
    conversationId: conversation._id,
    message: populatedMessage,
  });

  res.status(201).json({ success: true, message: populatedMessage, conversationId: conversation._id });
});

// @desc    Reply to a story — sends a DM with a story-snapshot attached,
//          and creates a "story_reply" notification for the story owner.
// @route   POST /api/messages/story-reply
// @access  Private
const replyToStory = asyncHandler(async (req, res) => {
  const { storyId, text } = req.body;

  if (!storyId || !text?.trim()) {
    res.status(400);
    throw new Error("storyId and text are required");
  }

  const story = await Story.findById(storyId);
  if (!story) {
    res.status(404);
    throw new Error("Story not found");
  }

  const storyOwnerId = story.user.toString();
  if (storyOwnerId === req.user._id.toString()) {
    res.status(400);
    throw new Error("Cannot reply to your own story");
  }

  const conversation = await findOrCreateConversation(req.user._id, storyOwnerId);

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    text: text.trim(),
    readBy: [req.user._id],
    storyReply: { story: story._id, imageUrl: story.image.url },
  });

  conversation.lastMessage = message._id;
  await conversation.save();

  const populatedMessage = await message.populate("sender", "username name avatar");

  const notification = await Notification.create({
    recipient: storyOwnerId,
    sender: req.user._id,
    type: "story_reply",
  });
  const populatedNotification = await notification.populate("sender", "username name avatar");

  const io = req.app.get("io");
  io.to(storyOwnerId).emit("newMessage", {
    conversationId: conversation._id,
    message: populatedMessage,
  });
  io.to(storyOwnerId).emit("newNotification", populatedNotification);

  res.status(201).json({ success: true, message: populatedMessage, conversationId: conversation._id });
});

module.exports = { getConversations, getMessages, sendMessage, replyToStory };