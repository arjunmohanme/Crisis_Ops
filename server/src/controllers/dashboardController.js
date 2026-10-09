import { getDashboard } from "../services/dashboardService.js";

export const getDashboardController = async (req, res, next) => {
  try {
    const dashboard = await getDashboard({
      userId: req.user._id,
      role: req.user.role,
    });

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};