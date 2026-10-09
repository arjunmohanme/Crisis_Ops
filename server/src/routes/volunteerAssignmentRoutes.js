import express from "express";

import {
  createVolunteerAssignmentController,
  getAllVolunteerAssignmentsController,
  getVolunteerAssignmentByIdController,
  getMyVolunteerAssignmentsController,
  updateVolunteerAssignmentController,
  cancelVolunteerAssignmentController,
} from "../controllers/volunteerAssignmentController.js";

import {
  createVolunteerAssignmentValidator,
  updateVolunteerAssignmentValidator,
  validateRequest,
} from "../validators/volunteerAssignmentValidator.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Only Admin can assign volunteers.
router.post(
  "/",
  protect,
  allowRoles("Admin"),
  createVolunteerAssignmentValidator,
  validateRequest,
  createVolunteerAssignmentController
);

// Admin can view all assignments.
router.get(
  "/",
  protect,
  allowRoles("Admin"),
  getAllVolunteerAssignmentsController
);

// Volunteer can view their own assignments.
router.get(
  "/mine",
  protect,
  allowRoles("Volunteer"),
  getMyVolunteerAssignmentsController
);

// Admin or Volunteer can view a specific assignment.
router.get(
  "/:id",
  protect,
  allowRoles("Admin", "Volunteer"),
  getVolunteerAssignmentByIdController
);

// Volunteer updates their own assignment status.
router.patch(
  "/:id",
  protect,
  allowRoles("Volunteer"),
  updateVolunteerAssignmentValidator,
  validateRequest,
  updateVolunteerAssignmentController
);

// Admin can cancel an assignment.
router.patch(
  "/:id/cancel",
  protect,
  allowRoles("Admin"),
  cancelVolunteerAssignmentController
);

export default router;