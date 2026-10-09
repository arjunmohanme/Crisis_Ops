import { body, validationResult } from "express-validator";

export const createOrganizationValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Organization name is required")
    .isLength({ min: 2, max: 150 })
    .withMessage(
      "Organization name must be between 2 and 150 characters"
    ),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage(
      "Organization description cannot exceed 1000 characters"
    ),

  body("contactPerson")
    .trim()
    .notEmpty()
    .withMessage("Contact person is required")
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Contact person must be between 2 and 100 characters"
    ),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Organization email is required")
    .isEmail()
    .withMessage("Enter a valid organization email")
    .normalizeEmail(),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Organization phone is required")
    .isMobilePhone("any")
    .withMessage("Enter a valid organization phone number"),

  body("address")
    .trim()
    .notEmpty()
    .withMessage("Organization address is required")
    .isLength({ max: 300 })
    .withMessage(
      "Organization address cannot exceed 300 characters"
    ),
];

export const updateOrganizationValidator = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Organization name cannot be empty")
    .isLength({ min: 2, max: 150 })
    .withMessage(
      "Organization name must be between 2 and 150 characters"
    ),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage(
      "Organization description cannot exceed 1000 characters"
    ),

  body("contactPerson")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Contact person cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Contact person must be between 2 and 100 characters"
    ),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Enter a valid organization email")
    .normalizeEmail(),

  body("phone")
    .optional()
    .trim()
    .isMobilePhone("any")
    .withMessage("Enter a valid organization phone number"),

  body("address")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Organization address cannot be empty")
    .isLength({ max: 300 })
    .withMessage(
      "Organization address cannot exceed 300 characters"
    ),

  body("status")
    .optional()
    .isIn(["Pending", "Approved", "Suspended"])
    .withMessage("Invalid organization status"),
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