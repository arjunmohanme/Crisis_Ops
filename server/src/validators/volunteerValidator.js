import { body, validationResult } from "express-validator";

export const updateVolunteerProfileValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("phone")
    .optional()
    .trim()
    .isMobilePhone("any")
    .withMessage("Enter a valid phone number"),

  body("skills")
    .optional()
    .isArray()
    .withMessage("Skills must be an array"),

  body("skills.*")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Skill cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Each skill cannot exceed 100 characters"),

  body("availability")
    .optional()
    .isIn(["Available", "Unavailable"])
    .withMessage(
      "Availability must be Available or Unavailable"
    ),
];

export const updateVolunteerAdminValidator = [
  body("isFieldVerifier")
    .optional()
    .isBoolean()
    .withMessage("isFieldVerifier must be true or false"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false"),

  body("isBlocked")
    .optional()
    .isBoolean()
    .withMessage("isBlocked must be true or false"),

  body("availability")
    .optional()
    .isIn(["Available", "Unavailable"])
    .withMessage(
      "Availability must be Available or Unavailable"
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