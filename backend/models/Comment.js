// backend/models/Comment.js

// Polymorphic Comment model — works for both Posts and Reels

// targetType + targetId lets one model serve both surfaces

// parentComment enables threaded replies (Instagram Comments 2.0)


const mongoose = require("mongoose");


const commentSchema = new mongoose.Schema(

  {

    text: {

      type: String,

      required: [true, "Comment text is required"],

      trim: true,

      maxlength: [500, "Comment cannot exceed 500 characters"],

    },

    author: {

      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: [true, "Author is required"],

      index: true,

    },

    // Polymorphic target — "post" or "reel"

    targetType: {

      type: String,

      enum: ["post", "reel"],

      required: true,

      index: true,

    },

    targetId: {

      type: mongoose.Schema.Types.ObjectId,

      required: true,

      refPath: "targetType",

      index: true,

    },

    // For threaded replies (Comments 2.0)

    parentComment: {

      type: mongoose.Schema.Types.ObjectId,

      ref: "Comment",

      default: null,

    },

    likes: [

      {

        type: mongoose.Schema.Types.ObjectId,

        ref: "User",

      },

    ],

  },

  { timestamps: true }

);


// Compound index for fast feed-style queries: get comments for X target, newest first

commentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });


// Compound index for threaded replies under a parent

commentSchema.index({ parentComment: 1, createdAt: 1 });


module.exports = mongoose.model("Comment", commentSchema);

