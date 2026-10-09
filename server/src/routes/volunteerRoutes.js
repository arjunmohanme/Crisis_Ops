import express from "express";

import {
  getAllVolunteersController,
  getVolunteerByIdController,
  getAvailableVolunteersController,
  updateVolunteerProfileController,
  updateVolunteerByAdminController,
} from "../controllers/volunteerController.js";

import {
  updateVolunteerProfileValidator,
  updateVolunteerAdminValidator,
  validateRequest,
} from "../validators/volunteerValidator.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Admin can view all volunteers.
router.get(
  "/",
  protect,
  allowRoles("Admin"),
  getAllVolunteersController
);

// Admin can view only currently available volunteers.
router.get(
  "/available",
  protect,
  allowRoles("Admin"),
  getAvailableVolunteersController
);

// Volunteer can update their own profile.
router.patch(
  "/profile",
  protect,
  allowRoles("Volunteer"),
  updateVolunteerProfileValidator,
  validateRequest,
  updateVolunteerProfileController
);

// Admin can view a specific volunteer.
router.get(
  "/:id",
  protect,
  allowRoles("Admin"),
  getVolunteerByIdController
);

// Admin can manage volunteer status and field-verifier capability.
router.patch(
  "/:id",
  protect,
  allowRoles("Admin"),
  updateVolunteerAdminValidator,
  validateRequest,
  updateVolunteerByAdminController
);

export default router;