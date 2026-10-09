import { body, validationResult } from "express-validator";

export const createVolunteerAssignmentValidator = [
  body("incident")
    .trim()
    .notEmpty()
    .withMessage("Incident ID is required")
    .isMongoId()
    .withMessage("Invalid incident ID"),

  body("volunteer")
    .trim()
    .notEmpty()
    .withMessage("Volunteer ID is required")
    .isMongoId()
    .withMessage("Invalid volunteer ID"),

  body("task")
    .trim()
    .notEmpty()
    .withMessage("Assignment task is required")
    .isLength({ min: 5, max: 500 })
    .withMessage(
      "Assignment task must be between 5 and 500 characters"
    ),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage(
      "Assignment notes cannot exceed 1000 characters"
    ),
];

export const updateVolunteerAssignmentValidator = [
  body("status")
    .optional()
    .trim()
    .isIn([
      "Accepted",
      "Rejected",
      "In Progress",
      "Completed",
      "Cancelled",
    ])
    .withMessage("Invalid assignment status"),

  body("completionNotes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage(
      "Completion notes cannot exceed 1000 characters"
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