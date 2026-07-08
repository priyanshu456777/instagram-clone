const { body } = require("express-validator");

const commentValidator = [
  body("text")
    .trim()
    .notEmpty()
    .withMessage("Comment text cannot be empty")
    .isLength({ max: 500 })
    .withMessage("Comment cannot exceed 500 characters"),
];

module.exports = { commentValidator };
