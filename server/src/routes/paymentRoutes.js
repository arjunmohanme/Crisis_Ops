import express from "express";
import { body } from "express-validator";

import {
  createDonationOrderController,
  verifyDonationPaymentController,
} from "../controllers/donationController.js";

import {
  createDonationValidator,
  verifyDonationValidator,
  validateRequest,
} from "../validators/donationValidator.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/create-order",
  protect,
  createDonationValidator,
  validateRequest,
  createDonationOrderController
);

router.post(
  "/verify",
  protect,
  [
    body("donationId")
      .trim()
      .notEmpty()
      .withMessage("Donation ID is required")
      .isMongoId()
      .withMessage("Invalid donation ID"),
    ...verifyDonationValidator,
  ],
  validateRequest,
  verifyDonationPaymentController
);

export default router;
