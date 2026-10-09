import { body, validationResult } from "express-validator";

export const createResourceRequestValidator = [
  body("incident")
    .trim()
    .notEmpty()
    .withMessage("Incident ID is required")
    .isMongoId()
    .withMessage("Invalid incident ID"),

  body("resource")
    .trim()
    .notEmpty()
    .withMessage("Resource ID is required")
    .isMongoId()
    .withMessage("Invalid resource ID"),

  body("requestedQuantity")
    .notEmpty()
    .withMessage("Requested quantity is required")
    .isInt({ min: 1 })
    .withMessage(
      "Requested quantity must be a positive integer"
    ),

  body("reason")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Reason cannot exceed 1000 characters"),
];

export const reviewResourceRequestValidator = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Review status is required")
    .isIn(["Approved", "Rejected"])
    .withMessage(
      "Review status must be Approved or Rejected"
    ),

  body("rejectionReason")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage(
      "Rejection reason cannot exceed 500 characters"
    ),

  body("rejectionReason").custom((reason, { req }) => {
    if (
      req.body.status === "Rejected" &&
      !reason?.trim()
    ) {
      throw new Error(
        "Rejection reason is required when rejecting a request"
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