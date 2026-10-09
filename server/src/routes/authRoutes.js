import express from "express";

import {
  register,
  login,
  forgotPassword,
  resetPasswordController,
  updateProfile,
} from "../controllers/authController.js";

import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateProfileValidator,
  validateRequest,
} from "../validators/authValidator.js";

import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/*
 * Public authentication routes
 */

router.post(
  "/register",
  registerValidator,
  validateRequest,
  register
);

router.post(
  "/login",
  loginValidator,
  validateRequest,
  login
);

router.post(
  "/forgot-password",
  forgotPasswordValidator,
  validateRequest,
  forgotPassword
);

router.post(
  "/reset-password/:token",
  resetPasswordValidator,
  validateRequest,
  resetPasswordController
);

/*
 * Authenticated routes
 */

router.patch(
  "/profile",
  protect,
  updateProfileValidator,
  validateRequest,
  updateProfile
);

router.get(
  "/me",
  protect,
  async (req, res) => {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  }
);

/*
 * Admin authorization test
 */

router.get(
  "/admin-test",
  protect,
  allowRoles("Admin"),
  async (req, res) => {
    res.status(200).json({
      success: true,
      message: "Admin access granted",
    });
  }
);

export default router;