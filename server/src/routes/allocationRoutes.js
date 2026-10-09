import express from "express";

import {
  createAllocationController,
  getAllAllocationsController,
  getMyAllocationsController,
  getAllocationByIdController,
  fulfillAllocationController,
  cancelAllocationController,
} from "../controllers/allocationController.js";

import {
  createAllocationValidator,
  validateRequest,
} from "../validators/allocationValidator.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  allowRoles("Admin", "Organization"),
  createAllocationValidator,
  validateRequest,
  createAllocationController
);

router.get(
  "/",
  protect,
  allowRoles("Admin"),
  getAllAllocationsController
);

router.get(
  "/mine",
  protect,
  allowRoles("Organization"),
  getMyAllocationsController
);

router.get(
  "/:id",
  protect,
  allowRoles("Admin", "Organization"),
  getAllocationByIdController
);

router.patch(
  "/:id/fulfill",
  protect,
  allowRoles("Admin"),
  fulfillAllocationController
);

router.patch(
  "/:id/cancel",
  protect,
  allowRoles("Admin"),
  cancelAllocationController
);

export default router;