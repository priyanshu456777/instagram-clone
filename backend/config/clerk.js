const { createClerkClient } = require("@clerk/backend");

// Single shared Clerk backend client — used for verifying tokens, fetching
// user profiles (self-heal / webhook), and anything else backend-side.
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

module.exports = clerkClient;
