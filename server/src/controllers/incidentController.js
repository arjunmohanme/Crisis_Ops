import {
  createIncident,
  getAllIncidents,
  getIncidentById,
  getMyIncidents,
  updateIncident,
  deleteIncident,
} from "../services/incidentService.js";

export const createIncidentController = async (
  req,
  res,
  next
) => {
  try {
    const incident = await createIncident({
      ...req.body,
      reportedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Incident reported successfully",
      incident,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllIncidentsController = async (
  req,
  res,
  next
) => {
  try {
    const result = await getAllIncidents(req.query, req.user);

    res.status(200).json({
      success: true,
      count: result.incidents.length,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getIncidentByIdController = async (
  req,
  res,
  next
) => {
  try {
    const incident = await getIncidentById(
      req.params.id,
      req.user
    );

    res.status(200).json({
      success: true,
      incident,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyIncidentsController = async (
  req,
  res,
  next
) => {
  try {
    const incidents = await getMyIncidents(
      req.user._id
    );

    res.status(200).json({
      success: true,
      count: incidents.length,
      incidents,
    });
  } catch (error) {
    next(error);
  }
};

export const updateIncidentController = async (
  req,
  res,
  next
) => {
  try {
    const incident = await updateIncident(
      req.params.id,
      req.user._id,
      req.body,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: "Incident updated successfully",
      incident,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteIncidentController = async (
  req,
  res,
  next
) => {
  try {
    const result = await deleteIncident(
      req.params.id,
      req.user._id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};