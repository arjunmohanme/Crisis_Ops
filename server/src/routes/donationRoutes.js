import express from "express";

import {
  createDonationOrderController,
  verifyDonationPaymentController,
  getDonationEligibleIncidentsController,
  getAllDonationsController,
  getDonationByIdController,
  getMyDonationsController,
  getDonationHistoryController,
} from "../controllers/donationController.js";

import {
  createDonationValidator,
  verifyDonationValidator,
  validateRequest,
} from "../validators/donationValidator.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  createDonationValidator,
  validateRequest,
  createDonationOrderController
);

router.post(
  "/:id/verify",
  protect,
  verifyDonationValidator,
  validateRequest,
  verifyDonationPaymentController
);

// SRS-compatible payment endpoints are mounted through /api/donations as legacy aliases.
router.post(
  "/payments/create-order",
  protect,
  createDonationValidator,
  validateRequest,
  createDonationOrderController
);

router.post(
  "/payments/verify",
  protect,
  verifyDonationValidator,
  validateRequest,
  verifyDonationPaymentController
);

router.get(
  "/mine",
  protect,
  allowRoles(
    "Citizen",
    "Volunteer",
    "Organization",
    "Admin"
  ),
  getMyDonationsController
);

router.get(
  "/eligible-incidents",
  protect,
  allowRoles(
    "Citizen",
    "Volunteer",
    "Organization",
    "Admin"
  ),
  getDonationEligibleIncidentsController
);

router.get(
  "/",
  protect,
  allowRoles(
    "Citizen",
    "Volunteer",
    "Organization",
    "Admin"
  ),
  getDonationHistoryController
);

router.get(
  "/:id",
  protect,
  allowRoles("Admin"),
  getDonationByIdController
);

export default router;