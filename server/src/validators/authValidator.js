import {
  body,
  validationResult,
} from "express-validator";

export const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({
      min: 2,
      max: 50,
    })
    .withMessage(
      "Name must be between 2 and 50 characters"
    ),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({
      min: 8,
    })
    .withMessage(
      "Password must be at least 8 characters"
    ),

  body("role")
    .optional()
    .isIn([
      "Citizen",
      "Volunteer",
      "Organization",
    ])
    .withMessage(
      "Invalid registration role"
    ),

  body("phone")
    .optional()
    .trim()
    .isMobilePhone("any")
    .withMessage(
      "Enter a valid phone number"
    ),
];

export const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

export const forgotPasswordValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),
];

export const resetPasswordValidator = [
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({
      min: 8,
    })
    .withMessage(
      "New password must be at least 8 characters"
    ),
];

export const validateRequest = (
  req,
  res,
  next
) => {
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

export const updateProfileValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("phone")
    .optional({ values: "null" })
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
    .isLength({ min: 1, max: 100 })
    .withMessage("Each skill must be between 1 and 100 characters"),

  body("availability")
    .optional()
    .isIn(["Available", "Unavailable"])
    .withMessage("Invalid availability"),

  body("location")
    .optional()
    .isObject()
    .withMessage("Location must be an object"),

  body("location.address")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 300 })
    .withMessage("Location address cannot exceed 300 characters"),

  body("location.latitude")
    .optional({ values: "null" })
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  body("location.longitude")
    .optional({ values: "null" })
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),
];
