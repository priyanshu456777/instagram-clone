const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Links this profile document to the Clerk user that owns it. Clerk is the
    // single source of truth for identity/credentials — we never store or
    // touch a password here at all.
    clerkId: {
      type: String,
      required: [true, "clerkId is required"],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [/^[a-z0-9._]+$/, "Username can only contain letters, numbers, dots and underscores"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    bio: {
      type: String,
      default: "",
      maxlength: [150, "Bio cannot exceed 150 characters"],
    },
    location: {
      type: String,
      default: "",
      maxlength: [100, "Location cannot exceed 100 characters"],
    },
    profession: {
      type: String,
      default: "",
      maxlength: [100, "Profession cannot exceed 100 characters"],
    },
    avatar: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  },
  { timestamps: true }
);

// Virtual counts — computed on the fly, never stored/duplicated (avoids drift bugs)
userSchema.virtual("followersCount").get(function () {
  return this.followers ? this.followers.length : 0;
});
userSchema.virtual("followingCount").get(function () {
  return this.following ? this.following.length : 0;
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

// Helpful index for fast profile/username lookups
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model("User", userSchema);
