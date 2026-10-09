import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getDashboardController } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/", protect, getDashboardController);

export default router;