const mongoose = require("mongoose");

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    image: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24hr from creation
    },
  },
  { timestamps: true }
);

// TTL index — MongoDB automatically deletes the document once expiresAt is reached.
// This means we never need a cron job to clean up old stories.
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Useful for quickly fetching "does this user have an active story" + sorting by user
storySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Story", storySchema);