// 404 handler — catches any route that doesn't match
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Centralized error handler — every controller uses asyncHandler + throw new Error(),
// which lands here. This guarantees ONE consistent JSON error shape across the
// entire API instead of inconsistent try/catch blocks scattered everywhere
// (a very common reason backend marks get cut).
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose bad ObjectId
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found";
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "Image file is too large. Maximum size is 5MB.";
  }

  res.status(statusCode).json({
    success: false,
    message: message || "Server Error",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
