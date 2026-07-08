const express = require("express");
const { getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Signup/login/logout are handled entirely by Clerk on the frontend now —
// this is the only route our own backend needs to expose.
router.get("/me", protect, getMe);

module.exports = router;
