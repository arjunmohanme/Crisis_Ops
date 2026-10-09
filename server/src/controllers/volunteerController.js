import {
  getAllVolunteers,
  getVolunteerById,
  updateVolunteerProfile,
  updateVolunteerByAdmin,
  getAvailableVolunteers,
} from "../services/volunteerService.js";

export const getAllVolunteersController = async (
  req,
  res,
  next
) => {
  try {
    const volunteers =
      await getAllVolunteers(req.query);

    res.status(200).json({
      success: true,
      count: volunteers.length,
      volunteers,
    });
  } catch (error) {
    next(error);
  }
};

export const getVolunteerByIdController = async (
  req,
  res,
  next
) => {
  try {
    const volunteer =
      await getVolunteerById(req.params.id);

    res.status(200).json({
      success: true,
      volunteer,
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailableVolunteersController =
  async (req, res, next) => {
    try {
      const volunteers =
        await getAvailableVolunteers();

      res.status(200).json({
        success: true,
        count: volunteers.length,
        volunteers,
      });
    } catch (error) {
      next(error);
    }
  };

export const updateVolunteerProfileController =
  async (req, res, next) => {
    try {
      const volunteer =
        await updateVolunteerProfile({
          id: req.user._id,
          updates: req.body,
        });

      res.status(200).json({
        success: true,
        message:
          "Volunteer profile updated successfully",
        volunteer,
      });
    } catch (error) {
      next(error);
    }
  };

export const updateVolunteerByAdminController =
  async (req, res, next) => {
    try {
      const volunteer =
        await updateVolunteerByAdmin({
          id: req.params.id,
          updates: req.body,
        });

      res.status(200).json({
        success: true,
        message:
          "Volunteer updated successfully",
        volunteer,
      });
    } catch (error) {
      next(error);
    }
  };