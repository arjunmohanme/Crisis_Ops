import express from "express";

import {
  createIncidentController,
  getAllIncidentsController,
  getIncidentByIdController,
  getMyIncidentsController,
  updateIncidentController,
  deleteIncidentController,
} from "../controllers/incidentController.js";

import {
  createIncidentValidator,
  updateIncidentValidator,
  validateRequest,
} from "../validators/incidentValidator.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import {
  updateIncidentOperationalController,
} from "../controllers/incidentAdminController.js";
import {
  updateIncidentOperationalValidator,
} from "../validators/incidentAdminValidator.js";

const router = express.Router();

// Citizen reports a new incident
router.post(
  "/",
  protect,
  allowRoles("Citizen", "Volunteer", "Organization", "Admin"),
  createIncidentValidator,
  validateRequest,
  createIncidentController
);

// Admin, Volunteer and Organization can view operational incidents
router.get(
  "/",
  protect,
  allowRoles("Admin", "Volunteer", "Organization", "Citizen"),
  getAllIncidentsController
);

// Authenticated citizen can view their own reports
router.get(
  "/mine",
  protect,
  allowRoles("Citizen", "Volunteer", "Organization", "Admin"),
  getMyIncidentsController
);

// Operational users can view a specific incident
router.get(
  "/:id",
  protect,
  allowRoles("Admin", "Volunteer", "Organization", "Citizen"),
  getIncidentByIdController
);

// SRS lifecycle endpoint: administrators change the incident lifecycle state.
router.patch(
  "/:id/status",
  protect,
  allowRoles("Admin"),
  updateIncidentOperationalValidator,
  validateRequest,
  updateIncidentOperationalController
);

// Citizen can update their own report; PUT is exposed as the SRS-compatible alias.
router.put(
  "/:id",
  protect,
  allowRoles("Citizen", "Admin"),
  updateIncidentValidator,
  validateRequest,
  updateIncidentController
);

router.patch(
  "/:id",
  protect,
  allowRoles("Citizen", "Admin"),
  updateIncidentValidator,
  validateRequest,
  updateIncidentController
);

// Citizen can delete their own unreviewed report
router.delete(
  "/:id",
  protect,
  allowRoles("Citizen", "Admin"),
  deleteIncidentController
);

export default router;