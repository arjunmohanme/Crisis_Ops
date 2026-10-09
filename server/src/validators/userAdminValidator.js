import { body, validationResult } from "express-validator";

export const rejectApplicationValidator = [
  body("rejectionReason")
    .trim()
    .notEmpty()
    .withMessage("Rejection reason is required")
    .isLength({ min: 3, max: 500 })
    .withMessage(
      "Rejection reason must be between 3 and 500 characters"
    ),
];

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  next();
};

export const accountControlValidator = [
  body("blocked").isBoolean().withMessage("blocked must be boolean"),
];
