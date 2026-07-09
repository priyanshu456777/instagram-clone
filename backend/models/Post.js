// backend/models/Post.js — REPLACE existing Post.js with this.
// Added: `saved` array (mirrors `likes` pattern) for bookmark/save feature.

const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Multi-image carousel. Single-image posts use this with one element.
    images: [
      {
        url: { type: String, required: [true, "Post image is required"] },
        publicId: { type: String, required: true },
      },
    ],
    caption: { type: String, default: "", maxlength: [2200, "Caption cannot exceed 2200 characters"] },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Track users who saved/bookmarked this post.
    saved: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    commentsCount: { type: Number, default: 0, min: 0 },
    hashtags: [{ type: String, lowercase: true, trim: true }],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    location: { type: String, default: "", maxlength: [100, "Location cannot exceed 100 characters"] },
  },
  { timestamps: true }
);

// Virtual for first image — keeps old API responses working when the client
// still asks for `post.image` instead of `post.images[0]`.
postSchema.virtual("image").get(function () {
  if (!this.images || this.images.length === 0) return null;
  return this.images[0];
});

postSchema.virtual("likesCount").get(function () {
  return this.likes.length;
});

postSchema.virtual("savesCount").get(function () {
  return this.saved.length;
});

postSchema.set("toJSON", { virtuals: true });
postSchema.set("toObject", { virtuals: true });

// Feed queries always sort by newest first — index supports that access pattern
postSchema.index({ createdAt: -1 });
postSchema.index({ hashtags: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);