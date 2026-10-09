import express from "express";

import {
  getAllAuditLogsController,
  getAuditLogsByEntityController,
} from "../controllers/auditLogController.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Admin can view all audit logs.
router.get(
  "/",
  protect,
  allowRoles("Admin"),
  getAllAuditLogsController
);

// Admin can view audit history for a specific entity.
router.get(
  "/:entityType/:entityId",
  protect,
  allowRoles("Admin"),
  getAuditLogsByEntityController
);

export default router;