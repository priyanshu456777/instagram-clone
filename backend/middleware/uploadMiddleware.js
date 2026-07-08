const multer = require("multer");

// Store file in memory as a buffer, then stream it to Cloudinary in the
// controller. Avoids writing temp files to disk (cleaner + faster on
// serverless/hosted environments like Render/Railway).
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only .jpg, .jpeg, .png and .webp image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max — keeps uploads fast, no delays
});

module.exports = upload;
