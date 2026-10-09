import express from "express";

import {
  getPendingApplicationsController,
  approveApplicationController,
  rejectApplicationController,
  getAllUsersController,
  setAccountControlController,
} from "../controllers/userAdminController.js";

import {
  rejectApplicationValidator,
  accountControlValidator,
  validateRequest,
} from "../validators/userAdminValidator.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/",
  protect,
  allowRoles("Admin"),
  getAllUsersController
);

// Admin can view pending Volunteer/Organization applications.
router.get(
  "/pending",
  protect,
  allowRoles("Admin"),
  getPendingApplicationsController
);

// Admin approves a pending application.
router.patch(
  "/:id/account-status",
  protect,
  allowRoles("Admin"),
  accountControlValidator,
  validateRequest,
  setAccountControlController
);

router.patch(
  "/:id/approve",
  protect,
  allowRoles("Admin"),
  approveApplicationController
);

// Admin rejects a pending application.
router.patch(
  "/:id/reject",
  protect,
  allowRoles("Admin"),
  rejectApplicationValidator,
  validateRequest,
  rejectApplicationController
);

export default router;