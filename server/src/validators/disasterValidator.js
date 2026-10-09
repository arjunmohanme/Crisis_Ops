import { body, validationResult } from "express-validator";

export const createDisasterValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Disaster name is required")
    .isLength({ min: 3, max: 100 })
    .withMessage(
      "Disaster name must be between 3 and 100 characters"
    ),

  body("type")
    .trim()
    .notEmpty()
    .withMessage("Disaster type is required")
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Disaster type must be between 2 and 100 characters"
    ),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage(
      "Description cannot exceed 1000 characters"
    ),

  body("affectedLocations")
    .optional()
    .isArray()
    .withMessage("Affected locations must be an array"),

  body("affectedLocations.*")
    .trim()
    .notEmpty()
    .withMessage("Affected location cannot be empty"),

  body("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Start date must be a valid date"),

  body("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("End date must be a valid date"),

  body("endDate").custom((endDate, { req }) => {
    if (!endDate || !req.body.startDate) {
      return true;
    }

    const start = new Date(req.body.startDate);
    const end = new Date(endDate);

    if (end <= start) {
      throw new Error(
        "End date must be after start date"
      );
    }

    return true;
  }),
];

export const updateDisasterValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Disaster name cannot be empty")
    .isLength({ min: 3, max: 100 })
    .withMessage(
      "Disaster name must be between 3 and 100 characters"
    ),

  body("type")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Disaster type cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Disaster type must be between 2 and 100 characters"
    ),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage(
      "Description cannot exceed 1000 characters"
    ),

  body("affectedLocations")
    .optional()
    .isArray()
    .withMessage("Affected locations must be an array"),

  body("affectedLocations.*")
    .trim()
    .notEmpty()
    .withMessage("Affected location cannot be empty"),

  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date"),

  body("endDate")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("End date must be a valid date"),

  body("status")
    .optional()
    .isIn(["Active", "Closed"])
    .withMessage("Invalid disaster status"),

  body("endDate").custom((endDate, { req }) => {
    if (!endDate || !req.body.startDate) {
      return true;
    }

    const start = new Date(req.body.startDate);
    const end = new Date(endDate);

    if (end <= start) {
      throw new Error(
        "End date must be after start date"
      );
    }

    return true;
  }),
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