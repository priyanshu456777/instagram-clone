// backend/models/Reel.js — NEW FILE.

// Instagram-style short video. Inherits the same patterns as Post.js so the

// models stay symmetric (both have likes, captions, hashtags, comments).


const mongoose = require("mongoose");


const reelSchema = new mongoose.Schema(

  {

    user: {

      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      index: true,

    },

    videoUrl: {

      type: String,

      required: [true, "Reel video is required"],

    },

    videoPublicId: {

      type: String,

      required: true,

    },

    // Auto-generated Cloudinary thumbnail (poster frame) — also used as

    // the cover shown in feeds / search results.

    thumbnailUrl: { type: String, default: "" },

    thumbnailPublicId: { type: String, default: "" },

    caption: {

      type: String,

      default: "",

      maxlength: [2200, "Caption cannot exceed 2200 characters"],

    },

    duration: {

      type: Number, // seconds

      default: 0,

    },

    aspectRatio: {

      type: String,

      default: "9:16",

      enum: ["9:16", "1:1", "4:5"],

    },

    // Optional audio/music track — free-form string for now.

    audio: {

      type: String,

      default: "",

      maxlength: 100,

    },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Distinct from likes — incremented on first view per session.

    viewsCount: { type: Number, default: 0 },

    commentsCount: { type: Number, default: 0, min: 0 },

    // Users who have viewed this reel — used to dedupe view counts.

    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    hashtags: [{ type: String, lowercase: true, trim: true }],

    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  },

  { timestamps: true }

);


reelSchema.virtual("likesCount").get(function () {

  return (this.likes || []).length;

});


reelSchema.set("toJSON", { virtuals: true });

reelSchema.set("toObject", { virtuals: true });


// Most-recent feed

reelSchema.index({ createdAt: -1 });

// Hashtag search

reelSchema.index({ hashtags: 1, createdAt: -1 });


module.exports = mongoose.model("Reel", reelSchema);

