const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    image: {
      url: { type: String, required: [true, "Post image is required"] },
      publicId: { type: String, required: true },
    },
    caption: {
      type: String,
      default: "",
      maxlength: [2200, "Caption cannot exceed 2200 characters"],
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

postSchema.virtual("likesCount").get(function () {
  return this.likes.length;
});

postSchema.set("toJSON", { virtuals: true });
postSchema.set("toObject", { virtuals: true });

// Feed queries always sort by newest first — index supports that access pattern
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
