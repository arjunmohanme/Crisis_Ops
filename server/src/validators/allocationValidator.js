import { body, validationResult } from "express-validator";

export const createAllocationValidator = [
  body("resourceRequest")
    .trim()
    .notEmpty()
    .withMessage("Resource request ID is required")
    .isMongoId()
    .withMessage("Invalid resource request ID"),

  body("allocatedQuantity")
    .notEmpty()
    .withMessage("Allocated quantity is required")
    .isInt({ min: 1 })
    .withMessage(
      "Allocated quantity must be a positive integer"
    ),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage(
      "Allocation notes cannot exceed 1000 characters"
    ),
];

export const updateAllocationValidator = [
  body("status")
    .optional()
    .trim()
    .isIn(["Fulfilled", "Cancelled"])
    .withMessage(
      "Status must be Fulfilled or Cancelled"
    ),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage(
      "Allocation notes cannot exceed 1000 characters"
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