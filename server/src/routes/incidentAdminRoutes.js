import express from "express";

import {
  updateIncidentOperationalController,
  getIncidentOperationalSummaryController,
} from "../controllers/incidentAdminController.js";

import {
  updateIncidentOperationalValidator,
  validateRequest,
} from "../validators/incidentAdminValidator.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Admin updates incident priority, lifecycle status,
// or disaster association.
router.patch(
  "/:id/operational",
  protect,
  allowRoles("Admin"),
  updateIncidentOperationalValidator,
  validateRequest,
  updateIncidentOperationalController
);

// Admin views the operational summary of an incident.
router.get(
  "/:id/operational",
  protect,
  allowRoles("Admin"),
  getIncidentOperationalSummaryController
);

export default router;