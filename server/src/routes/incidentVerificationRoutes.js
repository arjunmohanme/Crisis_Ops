import express from "express";

import {
  verifyIncidentController,
  getIncidentVerificationsController,
} from "../controllers/incidentVerificationController.js";

import {
  createIncidentVerificationValidator,
  validateRequest,
} from "../validators/incidentVerificationValidator.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Incident verification decisions are administrator-only per the SRS.
router.post(
  "/:id/verify",
  protect,
  allowRoles("Admin"),
  createIncidentVerificationValidator,
  validateRequest,
  verifyIncidentController
);

router.get(
  "/:id/verifications",
  protect,
  allowRoles("Admin", "Volunteer"),
  getIncidentVerificationsController
);

export default router;