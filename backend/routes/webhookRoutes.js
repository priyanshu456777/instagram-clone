const express = require("express");
const { handleClerkWebhook } = require("../controllers/webhookController");

const router = express.Router();

// express.raw() here (not express.json()) — svix needs the untouched raw
// bytes to verify Clerk's signature. See webhookController.js for details.
router.post("/clerk", express.raw({ type: "application/json" }), handleClerkWebhook);

module.exports = router;
