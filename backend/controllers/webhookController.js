const asyncHandler = require("express-async-handler");
const { Webhook } = require("svix");
const { syncUserFromClerk, deleteUserByClerkId } = require("../utils/clerkSync");

// Clerk calls this endpoint whenever a user is created/updated/deleted so our
// MongoDB "profile" collection (posts, followers, avatar, bio, etc — all the
// stuff Clerk itself doesn't store) stays in sync automatically.
//
// IMPORTANT: this route must receive the *raw* request body (not JSON-parsed)
// because svix verifies the signature against the exact raw bytes Clerk sent.
// That's why server.js mounts `express.raw()` on this specific route, before
// the global express.json() middleware.
const handleClerkWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error("CLERK_WEBHOOK_SECRET is not set — rejecting webhook.");
    return res.status(500).json({ success: false, message: "Webhook secret not configured" });
  }

  const svixHeaders = {
    "svix-id": req.headers["svix-id"],
    "svix-timestamp": req.headers["svix-timestamp"],
    "svix-signature": req.headers["svix-signature"],
  };

  let event;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(req.body, svixHeaders);
  } catch (err) {
    console.error("Clerk webhook signature verification failed:", err.message);
    return res.status(400).json({ success: false, message: "Invalid webhook signature" });
  }

  const { type, data } = event;

  switch (type) {
    case "user.created":
    case "user.updated":
      await syncUserFromClerk(data.id);
      break;
    case "user.deleted":
      await deleteUserByClerkId(data.id);
      break;
    default:
      // Ignore event types we don't care about (sessions, organizations, etc.)
      break;
  }

  res.status(200).json({ success: true, received: true });
});

module.exports = { handleClerkWebhook };
