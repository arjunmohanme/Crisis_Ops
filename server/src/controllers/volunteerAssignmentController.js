import {
  createVolunteerAssignment,
  getAllVolunteerAssignments,
  getVolunteerAssignmentById,
  getMyVolunteerAssignments,
  updateVolunteerAssignment,
  cancelVolunteerAssignment,
} from "../services/volunteerAssignmentService.js";

export const createVolunteerAssignmentController = async (
  req,
  res,
  next
) => {
  try {
    const assignment = await createVolunteerAssignment({
      incidentId: req.body.incident,
      volunteerId: req.body.volunteer,
      assignedBy: req.user._id,
      task: req.body.task,
      notes: req.body.notes,
    });

    res.status(201).json({
      success: true,
      message: "Volunteer assigned successfully",
      assignment,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllVolunteerAssignmentsController = async (
  req,
  res,
  next
) => {
  try {
    const assignments =
      await getAllVolunteerAssignments();

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    next(error);
  }
};

export const getVolunteerAssignmentByIdController = async (
  req,
  res,
  next
) => {
  try {
    const assignment =
      await getVolunteerAssignmentById(req.params.id);

    res.status(200).json({
      success: true,
      assignment,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyVolunteerAssignmentsController = async (
  req,
  res,
  next
) => {
  try {
    const assignments =
      await getMyVolunteerAssignments(req.user._id);

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    next(error);
  }
};

export const updateVolunteerAssignmentController = async (
  req,
  res,
  next
) => {
  try {
    const assignment =
      await updateVolunteerAssignment({
        id: req.params.id,
        volunteerId: req.user._id,
        status: req.body.status,
        completionNotes: req.body.completionNotes,
      });

    res.status(200).json({
      success: true,
      message: "Volunteer assignment updated successfully",
      assignment,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelVolunteerAssignmentController = async (
  req,
  res,
  next
) => {
  try {
    const assignment =
      await cancelVolunteerAssignment(req.params.id);

    res.status(200).json({
      success: true,
      message: "Volunteer assignment cancelled successfully",
      assignment,
    });
  } catch (error) {
    next(error);
  }
};