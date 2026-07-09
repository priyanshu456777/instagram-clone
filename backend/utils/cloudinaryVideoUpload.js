// backend/utils/cloudinaryVideoUpload.js — NEW FILE.

// Video-specific Cloudinary helper. The existing cloudinaryUpload.js is

// hardcoded to resource_type: "image"; videos need their own stream with

// resource_type: "video" + a video transformation profile.


const cloudinary = require("../config/cloudinary");


// uploadVideoToCloudinary

//   Streams a buffer straight to Cloudinary as a video.

//   Auto-generates a JPEG thumbnail at second-1 so frontend can use it as a

//   poster frame (saves us from generating a separate image upload).

const uploadVideoToCloudinary = (buffer, folder) => {

  return new Promise((resolve, reject) => {

    const stream = cloudinary.uploader.upload_stream(

      {

        folder,

        resource_type: "video",

        // Cap phone-shot reels at a sane size so we don't blow up the CDN.

        transformation: [

          { width: 720, height: 1280, crop: "limit" },

          { quality: "auto:good" },

          { fetch_format: "auto" },

        ],

        // Eager thumbnail so <video poster> works without a separate upload.

        eager: [

          { format: "jpg", transformation: [{ width: 480, height: 854, crop: "fill" }] },

        ],

        eager_async: false,

      },

      (error, result) => {

        if (error) return reject(error);

        resolve(result);

      }

    );

    stream.end(buffer);

  });

};


// deleteVideoFromCloudinary — separate from image deletion because the API

// requires resource_type: "video" to destroy video assets.

const deleteVideoFromCloudinary = async (publicId) => {

  if (!publicId) return;

  try {

    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });

  } catch (err) {

    console.error("Cloudinary video delete error:", err.message);

  }

};


module.exports = {

  uploadVideoToCloudinary,

  deleteVideoFromCloudinary,

};

