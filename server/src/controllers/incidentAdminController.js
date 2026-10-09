import {
  updateIncidentOperational,
  getIncidentOperationalSummary,
} from "../services/incidentAdminService.js";

export const updateIncidentOperationalController = async (
  req,
  res,
  next
) => {
  try {
    const incident = await updateIncidentOperational({
      incidentId: req.params.id,
      adminId: req.user._id,
      priority: req.body.priority,
      status: req.body.status,
      disaster: req.body.disaster,
      rejectionReason: req.body.rejectionReason,
      resolutionNotes: req.body.resolutionNotes,
    });

    res.status(200).json({
      success: true,
      message: "Incident updated successfully",
      incident,
    });
  } catch (error) {
    next(error);
  }
};

export const getIncidentOperationalSummaryController =
  async (req, res, next) => {
    try {
      const incident =
        await getIncidentOperationalSummary(
          req.params.id
        );

      res.status(200).json({
        success: true,
        incident,
      });
    } catch (error) {
      next(error);
    }
  };