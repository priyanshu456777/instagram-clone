// backend/routes/postRoutes.js

// ✅ FIX: HTTP method corrected to match frontend (PUT, not POST)

// Routes match the actual Post model in the repo (uses `user` field)


const express = require("express");

const router = express.Router();


// Resolve `upload` defensively — multiple export patterns supported

function resolveUpload() {

  try {

    const mod = require("../middleware/uploadMiddleware");

    if (mod && typeof mod === "function" && mod.array) return mod;

    if (mod && mod.upload && typeof mod.upload.array === "function") return mod.upload;

    if (mod && mod.uploads && typeof mod.uploads.array === "function") return mod.uploads;

    if (mod && mod.default) {

      if (typeof mod.default === "function" && mod.default.array) return mod.default;

      if (mod.default.upload && typeof mod.default.upload.array === "function") return mod.default.upload;

    }

  } catch (e) {}

  return null;

}


let upload = resolveUpload();

if (!upload) {

  console.warn("[postRoutes] uploadMiddleware not detected — using disk-storage fallback");

  try {

    const multer = require("multer");

    const path = require("path");

    const fs = require("fs");

    const uploadDir = path.join(__dirname, "..", "uploads");

    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    upload = multer({

      storage: multer.diskStorage({

        destination: (req, file, cb) => cb(null, uploadDir),

        filename: (req, file, cb) =>

          cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),

      }),

    });

  } catch (e) {

    console.error("[postRoutes] multer missing — npm i multer");

  }

}


const {

  createPost,

  getFeedPosts,       // accepts both — see controller

  getPostById,        // accepts both — see controller

  getUserPosts,       // accepts both — see controller

  toggleLike,

  toggleSave,

  getSavedPosts,

  getPostsByHashtag,

  deletePost,

} = require("../controllers/postController");


// Resolve `protect` defensively

function resolveProtect() {

  try {

    const mod = require("../middleware/authMiddleware");

    if (mod && typeof mod.protect === "function") return mod.protect;

    if (typeof mod === "function") return mod;

    if (mod && mod.default) {

      if (typeof mod.default === "function") return mod.default;

      if (typeof mod.default.protect === "function") return mod.default.protect;

    }

    if (mod && mod.auth) return mod.auth;

  } catch (e) {}

  return (req, res, next) => next();

}

const protect = resolveProtect();


// IMPORTANT: static routes MUST be declared before dynamic "/:id"

router.get("/", getFeedPosts);

router.get("/saved", protect, getSavedPosts);

router.get("/hashtag/:tag", getPostsByHashtag);

router.get("/user/:identifier", getUserPosts);

router.get("/:id", getPostById);


// Create

if (upload && typeof upload.array === "function") {

  router.post("/", protect, upload.array("images", 10), createPost);

} else if (upload && typeof upload.single === "function") {

  router.post("/", protect, upload.single("image"), createPost);

}


// ✅ FIX: PUT (not POST) — matches frontend api.put() calls

router.put("/:id/like", protect, toggleLike);

router.put("/:id/save", protect, toggleSave);


router.delete("/:id", protect, deletePost);


module.exports = router;

