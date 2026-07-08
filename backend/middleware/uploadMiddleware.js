const multer = require("multer");

// Store file in memory as a buffer, then stream it to Cloudinary in the
// controller. Avoids writing temp files to disk (cleaner + faster on
// serverless/hosted environments like Render/Railway).
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime"];

  if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only .jpg, .jpeg, .png, .webp images and .mp4 / .webm videos are allowed"),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    // 50MB to safely handle short videos too (Reels-ready). Pure-image posts
    // still get rejected earlier in the controller if individual file > 5MB.
    fileSize: 50 * 1024 * 1024,
  },
});

module.exports = upload;