import { body, validationResult } from "express-validator";

export const createResourceValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Resource name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Resource name must be between 2 and 100 characters"
    ),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Resource category is required")
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Resource category must be between 2 and 100 characters"
    ),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage(
      "Resource description cannot exceed 500 characters"
    ),

  body("unit")
    .trim()
    .notEmpty()
    .withMessage("Resource unit is required")
    .isLength({ min: 1, max: 50 })
    .withMessage(
      "Resource unit must be between 1 and 50 characters"
    ),

  body("totalQuantity")
    .notEmpty()
    .withMessage("Total quantity is required")
    .isFloat({ min: 0 })
    .withMessage("Total quantity must be a non-negative number"),

  body("availableQuantity")
    .optional()
    .isFloat({ min: 0 })
    .withMessage(
      "Available quantity must be a non-negative number"
    ),
];

export const updateResourceValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Resource name cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Resource name must be between 2 and 100 characters"
    ),

  body("category")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Resource category cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Resource category must be between 2 and 100 characters"
    ),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage(
      "Resource description cannot exceed 500 characters"
    ),

  body("unit")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Resource unit cannot be empty")
    .isLength({ min: 1, max: 50 })
    .withMessage(
      "Resource unit must be between 1 and 50 characters"
    ),

  body("totalQuantity")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Total quantity must be a non-negative number"),

  body("availableQuantity")
    .optional()
    .isFloat({ min: 0 })
    .withMessage(
      "Available quantity must be a non-negative number"
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