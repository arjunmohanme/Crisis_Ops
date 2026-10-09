import express from "express";

import {
  createDisasterController,
  getAllDisastersController,
  getDisasterByIdController,
  updateDisasterController,
} from "../controllers/disasterController.js";

import {
  createDisasterValidator,
  updateDisasterValidator,
  validateRequest,
} from "../validators/disasterValidator.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  allowRoles("Admin"),
  createDisasterValidator,
  validateRequest,
  createDisasterController
);

router.get(
  "/",
  protect,
  getAllDisastersController
);

router.get(
  "/:id",
  protect,
  getDisasterByIdController
);

router.patch(
  "/:id",
  protect,
  allowRoles("Admin"),
  updateDisasterValidator,
  validateRequest,
  updateDisasterController
);

export default router;