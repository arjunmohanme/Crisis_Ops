import {
  verifyIncident,
  getIncidentVerifications,
} from "../services/incidentVerificationService.js";

export const verifyIncidentController = async (req, res, next) => {
  try {
    const result = await verifyIncident({
      incidentId: req.params.id,
      verifiedBy: req.user,
      action: req.body.action,
      notes: req.body.notes,
      observedLocation: req.body.observedLocation,
      evidence: req.body.evidence,
    });

    res.status(201).json({
      success: true,
      message: `Incident ${req.body.action.toLowerCase()} successfully`,
      incident: result.incident,
      verification: result.verification,
    });
  } catch (error) {
    next(error);
  }
};

export const getIncidentVerificationsController = async (
  req,
  res,
  next
) => {
  try {
    const verifications = await getIncidentVerifications(
      req.params.id
    );

    res.status(200).json({
      success: true,
      count: verifications.length,
      verifications,
    });
  } catch (error) {
    next(error);
  }
};