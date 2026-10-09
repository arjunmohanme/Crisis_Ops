import express from "express";

import {
  createResourceRequestController,
  getAllResourceRequestsController,
  getResourceRequestByIdController,
  getMyResourceRequestsController,
  updateResourceRequestFulfillmentController,
} from "../controllers/resourceRequestController.js";

import {
  createResourceRequestValidator,
  validateRequest,
} from "../validators/resourceRequestValidator.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Organization, Volunteer, or Admin can create a resource request.
// Service layer performs the detailed authorization and business checks.
router.post(
  "/",
  protect,
  allowRoles("Organization", "Volunteer", "Admin"),
  createResourceRequestValidator,
  validateRequest,
  createResourceRequestController
);

// Administrators can view all requests; approved organizations can view requests for their resources.
router.get(
  "/",
  protect,
  allowRoles("Admin", "Organization"),
  getAllResourceRequestsController
);

// Organization/Volunteer can view their own requests.
router.get(
  "/mine",
  protect,
  allowRoles("Organization", "Volunteer"),
  getMyResourceRequestsController
);

// Authorized users can inspect a request they own, or an organization's request for its own resource.
router.get(
  "/:id",
  protect,
  allowRoles("Admin", "Organization", "Volunteer"),
  getResourceRequestByIdController
);

// Recalculate request fulfillment from valid allocation records.
router.patch(
  "/:id",
  protect,
  allowRoles("Admin", "Organization"),
  updateResourceRequestFulfillmentController
);


export default router;