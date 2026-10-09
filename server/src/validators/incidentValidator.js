import { body, validationResult } from "express-validator";

export const createIncidentValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Incident title is required")
    .isLength({ min: 5, max: 150 })
    .withMessage("Incident title must be between 5 and 150 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Incident description is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage(
      "Incident description must be between 10 and 2000 characters"
    ),

  body("type")
    .trim()
    .notEmpty()
    .withMessage("Incident type is required")
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Incident type must be between 2 and 100 characters"
    ),

  body("disaster")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("Invalid disaster ID"),

  body("location")
    .isObject()
    .withMessage("Location is required"),

  body("location.address")
    .trim()
    .notEmpty()
    .withMessage("Location address is required")
    .isLength({ max: 300 })
    .withMessage("Location address cannot exceed 300 characters"),

  body("location.latitude")
    .optional({ values: "falsy" })
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  body("location.longitude")
    .optional({ values: "falsy" })
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),

  body("estimatedPeopleAffected")
    .optional()
    .isInt({ min: 0 })
    .withMessage(
      "Estimated people affected must be a non-negative integer"
    ),

  body("priority")
    .optional()
    .trim()
    .isIn(["Low", "Medium", "High", "Critical"])
    .withMessage("Priority must be Low, Medium, High, or Critical"),

  body("requestedResources")
    .optional()
    .isArray()
    .withMessage("Requested resources must be an array"),

  body("requestedResources.*.name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Requested resource name is invalid"),

  body("requestedResources.*.quantity")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Requested resource quantity must be non-negative"),

  body("requestedResources.*.unit")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Requested resource unit is too long"),

  body("evidence")
    .optional()
    .isArray()
    .withMessage("Evidence must be an array"),

  body("evidence.*")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Each evidence item cannot exceed 500 characters"),
];

export const updateIncidentValidator = [
  body("priority")
    .optional()
    .trim()
    .isIn(["Low", "Medium", "High", "Critical"])
    .withMessage("Priority must be Low, Medium, High, or Critical"),

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Incident title cannot be empty")
    .isLength({ min: 5, max: 150 })
    .withMessage(
      "Incident title must be between 5 and 150 characters"
    ),

  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Incident description cannot be empty")
    .isLength({ min: 10, max: 2000 })
    .withMessage(
      "Incident description must be between 10 and 2000 characters"
    ),

  body("type")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Incident type cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Incident type must be between 2 and 100 characters"
    ),

  body("disaster")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("Invalid disaster ID"),

  body("location")
    .optional()
    .isObject()
    .withMessage("Location must be an object"),

  body("location.address")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Location address cannot be empty")
    .isLength({ max: 300 })
    .withMessage("Location address cannot exceed 300 characters"),

  body("location.latitude")
    .optional({ values: "falsy" })
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  body("location.longitude")
    .optional({ values: "falsy" })
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),

  body("estimatedPeopleAffected")
    .optional()
    .isInt({ min: 0 })
    .withMessage(
      "Estimated people affected must be a non-negative integer"
    ),

  body("evidence")
    .optional()
    .isArray()
    .withMessage("Evidence must be an array"),

  body("evidence.*")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Each evidence item cannot exceed 500 characters"),
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