const asyncHandler = require("express-async-handler");
const { verifyToken } = require("@clerk/backend");
const User = require("../models/User");
const { syncUserFromClerk } = require("../utils/clerkSync");

// Frontend sends the Clerk session token as a Bearer header (grabbed client-side
// via `window.Clerk.session.getToken()`). Keeping this to a single mechanism
// (no cookie-parsing branch) keeps the middleware simple and avoids Clerk vs
// our-own-cookie confusion.
const getBearerToken = (req) => {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    return header.split(" ")[1];
  }
  return null;
};

// Verifies the token with Clerk, then resolves it to our own MongoDB user
// document (via clerkId). If the Clerk webhook hasn't synced this user yet
// (e.g. request lands right after signup), self-heal by pulling the profile
// from Clerk directly instead of failing the request.
const resolveUser = async (token) => {
  if (!token) return null;

  let payload;
  try {
    payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
  } catch (err) {
    return null;
  }

  const clerkId = payload?.sub;
  if (!clerkId) return null;

  let user = await User.findOne({ clerkId });
  if (!user) {
    try {
      user = await syncUserFromClerk(clerkId);
    } catch (err) {
      user = null;
    }
  }

  return user;
};

// Protects routes — requires a valid Clerk session that resolves to a synced user.
const protect = asyncHandler(async (req, res, next) => {
  const token = getBearerToken(req);
  const user = await resolveUser(token);

  if (!user) {
    res.status(401);
    throw new Error("Not authorized. Please log in to continue.");
  }

  req.user = user;
  next();
});

// Optional auth — attaches req.user if a valid session exists, but never blocks
// the request. Useful for feed/profile routes that show extra data (e.g.
// "did I like this post") only when logged in.
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = getBearerToken(req);
  req.user = await resolveUser(token);
  next();
});

module.exports = { protect, optionalAuth };
