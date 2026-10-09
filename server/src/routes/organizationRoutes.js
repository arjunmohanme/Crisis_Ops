import express from "express";

import {
  createOrganizationController,
  getAllOrganizationsController,
  getOrganizationByIdController,
  getMyOrganizationController,
  updateOrganizationController,
  deleteOrganizationController,
} from "../controllers/organizationController.js";

import {
  createOrganizationValidator,
  updateOrganizationValidator,
  validateRequest,
} from "../validators/organizationValidator.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Organization users create their organization profile.
// Admin can also create one for administrative purposes.
router.post(
  "/",
  protect,
  allowRoles("Organization", "Admin"),
  createOrganizationValidator,
  validateRequest,
  createOrganizationController
);

// Admin can view all organizations.
router.get(
  "/",
  protect,
  allowRoles("Admin"),
  getAllOrganizationsController
);

// Organization user can view their own organization.
router.get(
  "/mine",
  protect,
  allowRoles("Organization"),
  getMyOrganizationController
);

// Admin can inspect any organization.
router.get(
  "/:id",
  protect,
  allowRoles("Admin", "Organization"),
  getOrganizationByIdController
);

// Organization owner can update their profile.
// Admin can update any organization and its status.
router.patch(
  "/:id",
  protect,
  allowRoles("Organization", "Admin"),
  updateOrganizationValidator,
  validateRequest,
  updateOrganizationController
);

// Organization owner or Admin can delete.
router.delete(
  "/:id",
  protect,
  allowRoles("Organization", "Admin"),
  deleteOrganizationController
);

export default router;