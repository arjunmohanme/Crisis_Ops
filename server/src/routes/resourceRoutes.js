import express from "express";

import {
  createResourceController,
  getAllResourcesController,
  getOrganizationResourcesController,
  getResourceByIdController,
  updateResourceController,
  deactivateResourceController,
  deleteResourceController,
} from "../controllers/resourceController.js";

import {
  createResourceValidator,
  updateResourceValidator,
  validateRequest,
} from "../validators/resourceValidator.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  allowRoles("Admin", "Organization"),
  createResourceValidator,
  validateRequest,
  createResourceController
);

router.get(
  "/",
  protect,
  allowRoles("Admin", "Organization", "Volunteer"),
  getAllResourcesController
);

router.get(
  "/organization/:organizationId",
  protect,
  allowRoles("Admin", "Organization"),
  getOrganizationResourcesController
);

router.get(
  "/:id",
  protect,
  allowRoles("Admin", "Organization", "Volunteer"),
  getResourceByIdController
);

router.put(
  "/:id",
  protect,
  allowRoles("Admin", "Organization"),
  updateResourceValidator,
  validateRequest,
  updateResourceController
);

router.patch(
  "/:id",
  protect,
  allowRoles("Admin", "Organization"),
  updateResourceValidator,
  validateRequest,
  updateResourceController
);

router.delete(
  "/:id",
  protect,
  allowRoles("Admin", "Organization"),
  deleteResourceController
);

router.patch(
  "/:id/deactivate",
  protect,
  allowRoles("Admin", "Organization"),
  deactivateResourceController
);

export default router;