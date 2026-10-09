import {
  getPendingApplications,
  approveApplication,
  rejectApplication,
  getAllUsers,
  setAccountControl,
} from "../services/userAdminService.js";

export const getPendingApplicationsController =
  async (req, res, next) => {
    try {
      const users =
        await getPendingApplications();

      return res.status(200).json({
        success: true,
        count: users.length,
        users,
      });
    } catch (error) {
      next(error);
    }
  };

export const approveApplicationController =
  async (req, res, next) => {
    try {
      const user =
        await approveApplication({
          userId:
            req.params.id,
          adminId:
            req.user._id,
        });

      return res.status(200).json({
        success: true,
        message:
          "Application approved successfully",
        user,
      });
    } catch (error) {
      next(error);
    }
  };

export const rejectApplicationController =
  async (req, res, next) => {
    try {
      const user =
        await rejectApplication({
          userId:
            req.params.id,
          adminId:
            req.user._id,
          rejectionReason:
            req.body.rejectionReason,
        });

      return res.status(200).json({
        success: true,
        message:
          "Application rejected successfully",
        user,
      });
    } catch (error) {
      next(error);
    }
  };

export const getAllUsersController = async (req, res, next) => {
  try {
    const users = await getAllUsers();
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) { next(error); }
};

export const setAccountControlController = async (req, res, next) => {
  try {
    const user = await setAccountControl({
      userId: req.params.id,
      adminId: req.user._id,
      blocked: req.body.blocked,
    });
    res.status(200).json({ success: true, message: user.isBlocked ? "User blocked" : "User unblocked", user });
  } catch (error) { next(error); }
};
