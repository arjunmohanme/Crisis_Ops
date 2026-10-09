import { body, validationResult } from "express-validator";

export const createDonationValidator = [
  body("incident")
    .trim()
    .notEmpty()
    .withMessage("Incident ID is required")
    .isMongoId()
    .withMessage("Invalid incident ID"),

  body("amount")
    .notEmpty()
    .withMessage("Donation amount is required")
    .isFloat({ min: 1 })
    .withMessage("Donation amount must be at least 1"),

  body("donorName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Donor name must be between 2 and 100 characters"
    ),

  body("donorEmail")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Enter a valid donor email")
    .normalizeEmail(),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Donation notes cannot exceed 500 characters"),
];

export const verifyDonationValidator = [
  body("razorpayOrderId")
    .trim()
    .notEmpty()
    .withMessage("Razorpay order ID is required"),

  body("razorpayPaymentId")
    .trim()
    .notEmpty()
    .withMessage("Razorpay payment ID is required"),

  body("razorpaySignature")
    .trim()
    .notEmpty()
    .withMessage("Razorpay signature is required"),
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