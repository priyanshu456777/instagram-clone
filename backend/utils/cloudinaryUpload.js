const cloudinary = require("../config/cloudinary");

// Wraps Cloudinary's upload_stream in a Promise so controllers can simply
// `await` it. Streams the buffer directly — no disk I/O, keeps uploads fast.
const uploadBufferToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [{ width: 1080, crop: "limit" }, { quality: "auto:good" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
  }
};

module.exports = { uploadBufferToCloudinary, deleteFromCloudinary };
