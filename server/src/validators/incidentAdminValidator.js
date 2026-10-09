import { body, validationResult } from "express-validator";

export const updateIncidentOperationalValidator = [
  body("priority")
    .optional()
    .trim()
    .isIn(["Low", "Medium", "High", "Critical"])
    .withMessage(
      "Priority must be Low, Medium, High, or Critical"
    ),

  body("status")
    .optional()
    .trim()
    .isIn([
      "Under Review",
      "Verified",
      "Active",
      "Resolved",
      "Archived",
      "Rejected",
    ])
    .withMessage("Invalid incident status"),

  body("rejectionReason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage(
      "Rejection reason cannot exceed 500 characters"
    ),

  body("resolutionNotes")
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Resolution notes must be between 1 and 1000 characters"),

  body("resolutionNotes").custom(
    (resolutionNotes, { req }) => {
      if (
        req.body.status === "Resolved" &&
        !resolutionNotes?.trim()
      ) {
        throw new Error(
          "Resolution notes are required when resolving an incident"
        );
      }
      return true;
    }
  ),

  body("rejectionReason").custom(
    (rejectionReason, { req }) => {
      if (
        req.body.status === "Rejected" &&
        !rejectionReason?.trim()
      ) {
        throw new Error(
          "Rejection reason is required when rejecting an incident"
        );
      }

      return true;
    }
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