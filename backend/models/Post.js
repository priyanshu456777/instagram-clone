const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Array of images for carousel posts. Single-image posts still use this
    // with one element — keeps the data shape uniform across the app.
    images: [
      {
        url: {
          type: String,
          required: [true, "Post image is required"],
        },
        publicId: {
          type: String,
          required: true,
        },
      },
    ],
    caption: {
      type: String,
      default: "",
      maxlength: [2200, "Caption cannot exceed 2200 characters"],
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Hashtags parsed from the caption at create time — pre-computed so the
    // search/explore page doesn't have to regex every caption at query time.
    hashtags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
    // User mentions parsed from the caption (e.g. "@priyanshu" -> ObjectId)
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Optional location tag, like real Instagram's "Add location"
    location: {
      type: String,
      default: "",
      maxlength: [100, "Location cannot exceed 100 characters"],
    },
  },
  { timestamps: true }
);

// Virtual for first image — keeps old API responses working
// when the client still asks for `post.image` instead of `post.images[0]`.
postSchema.virtual("image").get(function () {
  if (!this.images || this.images.length === 0) return null;
  return this.images[0];
});

postSchema.virtual("likesCount").get(function () {
  return this.likes.length;
});

postSchema.set("toJSON", { virtuals: true });
postSchema.set("toObject", { virtuals: true });

// Feed queries always sort by newest first — index supports that access pattern
postSchema.index({ createdAt: -1 });
// Hashtag search index
postSchema.index({ hashtags: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);