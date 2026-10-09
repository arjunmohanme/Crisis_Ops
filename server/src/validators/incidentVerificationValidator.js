import { body, validationResult } from "express-validator";

export const createIncidentVerificationValidator = [
  body("action")
    .trim()
    .notEmpty()
    .withMessage("Verification action is required")
    .isIn(["Verified", "Rejected"])
    .withMessage("Action must be Verified or Rejected"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Verification notes cannot exceed 1000 characters"),

  body("observedLocation")
    .optional()
    .isObject()
    .withMessage("Observed location must be an object"),

  body("observedLocation.address")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage(
      "Observed location address cannot exceed 300 characters"
    ),

  body("observedLocation.latitude")
    .optional({ values: "falsy" })
    .isFloat({ min: -90, max: 90 })
    .withMessage("Observed latitude must be between -90 and 90"),

  body("observedLocation.longitude")
    .optional({ values: "falsy" })
    .isFloat({ min: -180, max: 180 })
    .withMessage(
      "Observed longitude must be between -180 and 180"
    ),

  body("evidence")
    .optional()
    .isArray()
    .withMessage("Verification evidence must be an array"),

  body("evidence.*")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage(
      "Each verification evidence item cannot exceed 500 characters"
    ),

  body("notes").custom((notes, { req }) => {
    if (req.body.action === "Rejected" && !notes?.trim()) {
      throw new Error(
        "Verification notes are required when rejecting an incident"
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