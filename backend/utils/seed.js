// Quick demo-data seeder — run with `npm run seed` after setting up .env
// Creates 3 demo users **in Clerk itself** (so you can actually log in as
// them through the real sign-in form) and syncs matching MongoDB profiles +
// a few posts, so your live demo isn't an empty feed.
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const clerkClient = require("../config/clerk");
const { syncUserFromClerk } = require("./clerkSync");
const User = require("../models/User");
const Post = require("../models/Post");

const DEMO_PASSWORD = "InstaCloneDemo123!"; // meets Clerk's default password rules

const demoUsers = [
  {
    firstName: "John",
    lastName: "Doe",
    username: "john.doe",
    email: "john@example.com",
    bio: "Full Stack Developer. Building things for the web.",
    location: "New York, USA",
    profession: "Full Stack Developer",
  },
  {
    firstName: "Sarah",
    lastName: "Ahmed",
    username: "sarah_23",
    email: "sarah@example.com",
    bio: "Chasing sunsets 🌅",
    location: "Dubai, UAE",
    profession: "Photographer",
  },
  {
    firstName: "Rohit",
    lastName: "Verma",
    username: "rohit.dev",
    email: "rohit@example.com",
    bio: "Coffee, code, repeat.",
    location: "Bengaluru, India",
    profession: "Backend Engineer",
  },
];

const samplePosts = [
  {
    image: {
      url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
      publicId: "demo/mountain",
    },
    caption: "Nature is the art of God. 🌲",
  },
  {
    image: {
      url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      publicId: "demo/sunset",
    },
    caption: "Chasing sunsets 🧡",
  },
];

// Finds an existing Clerk user by email, or creates one.
const getOrCreateClerkUser = async (demoUser) => {
  const { data: existing } = await clerkClient.users.getUserList({
    emailAddress: [demoUser.email],
  });

  if (existing && existing.length > 0) return existing[0];

  return clerkClient.users.createUser({
    firstName: demoUser.firstName,
    lastName: demoUser.lastName,
    username: demoUser.username,
    emailAddress: [demoUser.email],
    password: DEMO_PASSWORD,
    skipPasswordChecks: false,
  });
};

const seed = async () => {
  await connectDB();

  console.log("Clearing existing demo profiles + posts...");
  const demoEmails = demoUsers.map((u) => u.email);
  const existingDemoProfiles = await User.find({ email: { $in: demoEmails } }).select("_id");
  await Post.deleteMany({ user: { $in: existingDemoProfiles.map((u) => u._id) } });
  await User.deleteMany({ email: { $in: demoEmails } });

  console.log("Creating demo users in Clerk + syncing profiles to MongoDB...");
  const createdProfiles = [];
  for (const demoUser of demoUsers) {
    const clerkUser = await getOrCreateClerkUser(demoUser);
    const profile = await syncUserFromClerk(clerkUser.id);
    // syncUserFromClerk pulls bio/location/etc from nowhere (Clerk doesn't
    // store them) — fill in the demo flavor text directly.
    profile.bio = demoUser.bio;
    profile.location = demoUser.location;
    profile.profession = demoUser.profession;
    await profile.save();
    createdProfiles.push(profile);
  }

  console.log("Creating demo posts...");
  await Post.create({ ...samplePosts[0], user: createdProfiles[0]._id });
  await Post.create({ ...samplePosts[1], user: createdProfiles[1]._id });

  console.log("✅ Seed complete. Demo login (use the real sign-in form):");
  demoUsers.forEach((u) => console.log(`   ${u.email} / ${DEMO_PASSWORD}`));

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
