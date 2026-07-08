const clerkClient = require("../config/clerk");
const User = require("../models/User");

// Builds a safe, unique-ish username candidate from whatever Clerk gives us.
const buildUsernameBase = (clerkUser) => {
  const raw =
    clerkUser.username ||
    clerkUser.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
    `user${clerkUser.id.slice(-6)}`;

  const cleaned = raw.toLowerCase().replace(/[^a-z0-9._]/g, "");
  return cleaned.length >= 3 ? cleaned : `user${clerkUser.id.slice(-6)}`;
};

const resolvePrimaryEmail = (clerkUser) => {
  const primary = clerkUser.emailAddresses?.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  );
  return (primary || clerkUser.emailAddresses?.[0])?.emailAddress;
};

// Creates or updates the local MongoDB profile for a given Clerk user id.
// Called from two places: the Clerk webhook (user.created / user.updated),
// and the auth middleware as a self-heal fallback in case a request comes in
// with a valid Clerk session before the webhook has landed (there's no
// ordering guarantee between "user finishes signing up in the browser" and
// "our webhook endpoint gets called").
const syncUserFromClerk = async (clerkId) => {
  const clerkUser = await clerkClient.users.getUser(clerkId);
  if (!clerkUser) return null;

  const email = resolvePrimaryEmail(clerkUser);
  let username = buildUsernameBase(clerkUser);

  const usernameTaken = await User.findOne({ username, clerkId: { $ne: clerkId } });
  if (usernameTaken) {
    username = `${username}${clerkId.slice(-4)}`;
  }

  const name =
    `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || username;

  const user = await User.findOneAndUpdate(
    { clerkId },
    {
      $set: {
        clerkId,
        name,
        username,
        email,
        ...(clerkUser.imageUrl ? { avatar: { url: clerkUser.imageUrl, publicId: "" } } : {}),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );

  return user;
};

const deleteUserByClerkId = async (clerkId) => {
  await User.findOneAndDelete({ clerkId });
};

module.exports = { syncUserFromClerk, deleteUserByClerkId };
