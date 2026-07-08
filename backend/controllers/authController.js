const asyncHandler = require("express-async-handler");
const User = require("../models/User");

// @desc    Get the currently logged-in user's synced MongoDB profile.
//          Clerk itself owns signup/login/logout on the frontend — this is
//          the only auth endpoint our own backend needs, since `protect`
//          middleware has already verified the Clerk session and resolved
//          (or self-healed) req.user by the time we get here.
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("followers", "username avatar")
    .populate("following", "username avatar");

  res.status(200).json({ success: true, user });
});

module.exports = { getMe };
