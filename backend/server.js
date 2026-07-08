const path = require("path");
require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const { verifyToken } = require("@clerk/backend");

const connectDB = require("./config/db");
const User = require("./models/User");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const storyRoutes = require("./routes/storyRoutes");
const messageRoutes = require("./routes/messageRoutes");

// Connect to MongoDB before anything else touches the DB
connectDB();

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// ---------- Socket.io setup ----------
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

// Authenticate socket connections using the same Clerk session token the
// frontend already fetches for REST calls (sent via `auth: { token }` on
// connect), then join the user to a private room keyed by their own MongoDB
// userId — this is what lets us push notifications straight to `io.to(userId)`.
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(); // allow anonymous connections for public post rooms

    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    const user = await User.findOne({ clerkId: payload.sub }).select("_id");
    if (user) socket.userId = user._id.toString();
    next();
  } catch (err) {
    next(); // invalid/expired token -> still allow connection as anonymous
  }
});

io.on("connection", (socket) => {
  if (socket.userId) {
    socket.join(socket.userId);
  }

  // Client joins a specific post's room to receive live like/comment updates
  // while viewing that post (e.g. post detail modal).
  socket.on("joinPost", (postId) => {
    socket.join(`post:${postId}`);
  });

  socket.on("leavePost", (postId) => {
    socket.leave(`post:${postId}`);
  });

  socket.on("disconnect", () => {
    // no-op, rooms are cleaned up automatically by socket.io
  });
});

// Make `io` available inside controllers via req.app.get("io")
app.set("io", io);

// ---------- Core middleware ----------
app.use(helmet());
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
// Clerk webhooks MUST be mounted before express.json() — the route itself
// applies express.raw() so svix can verify the signature against the exact
// raw request bytes Clerk sent, not a re-serialized JSON object.
app.use("/api/webhooks", webhookRoutes);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Basic health check — useful for uptime monitors and quick smoke tests
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "InstaClone API is running", time: new Date() });
});

// ---------- Routes ----------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);

// ---------- Error handling (must be last) ----------
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});

// Guard against unhandled promise rejections crashing the process silently
process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = { app, server, io };