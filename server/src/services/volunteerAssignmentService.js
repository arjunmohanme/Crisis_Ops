import mongoose from "mongoose";

import VolunteerAssignment from "../models/VolunteerAssignment.js";
import Incident from "../models/Incident.js";
import User from "../models/User.js";
import { createAuditLog } from "./auditLogService.js";

const validateAssignmentId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid assignment ID");
    error.statusCode = 400;
    throw error;
  }
};

const validateIncidentId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid incident ID");
    error.statusCode = 400;
    throw error;
  }
};

const validateVolunteerId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid volunteer ID");
    error.statusCode = 400;
    throw error;
  }
};

const validateVolunteer = async (volunteerId) => {
  validateVolunteerId(volunteerId);

  const volunteer = await User.findById(volunteerId);

  if (!volunteer) {
    const error = new Error("Volunteer not found");
    error.statusCode = 404;
    throw error;
  }

  if (volunteer.role !== "Volunteer") {
    const error = new Error(
      "Selected user is not a Volunteer"
    );
    error.statusCode = 400;
    throw error;
  }

  if (!volunteer.isActive) {
    const error = new Error(
      "Volunteer account is inactive"
    );
    error.statusCode = 400;
    throw error;
  }

  if (volunteer.isBlocked) {
    const error = new Error(
      "Volunteer account is blocked"
    );
    error.statusCode = 403;
    throw error;
  }

  if (volunteer.availability !== "Available") {
    const error = new Error(
      "Volunteer is currently unavailable"
    );
    error.statusCode = 400;
    throw error;
  }

  return volunteer;
};

const writeAuditLog = async ({
  actor,
  assignmentId,
  action,
  metadata = {},
}) => {
  if (!actor || !assignmentId) {
    return;
  }

  try {
    await createAuditLog({
      actor,
      action,
      entityType: "VolunteerAssignment",
      entityId: assignmentId,
      metadata,
    });
  } catch (error) {
    console.error(
      "Volunteer assignment audit log failed:",
      error.message
    );
  }
};

export const createVolunteerAssignment = async ({
  incidentId,
  volunteerId,
  assignedBy,
  task,
  notes,
}) => {
  validateIncidentId(incidentId);

  const incident = await Incident.findById(incidentId);

  if (!incident) {
    const error = new Error("Incident not found");
    error.statusCode = 404;
    throw error;
  }

  if (incident.status !== "Active") {
    const error = new Error(
      "Volunteers can only be assigned to active incidents"
    );
    error.statusCode = 400;
    throw error;
  }

  const volunteer =
    await validateVolunteer(volunteerId);

  const existingAssignment =
    await VolunteerAssignment.findOne({
      incident: incidentId,
      volunteer: volunteerId,
      status: {
        $in: [
          "Assigned",
          "Accepted",
          "In Progress",
        ],
      },
    });

  if (existingAssignment) {
    const error = new Error(
      "Volunteer is already assigned to this incident"
    );
    error.statusCode = 409;
    throw error;
  }

  const activeAssignment =
    await VolunteerAssignment.findOne({
      volunteer: volunteerId,
      status: {
        $in: [
          "Assigned",
          "Accepted",
          "In Progress",
        ],
      },
    });

  if (activeAssignment) {
    const error = new Error(
      "Volunteer already has an active assignment"
    );
    error.statusCode = 409;
    throw error;
  }

  const assignment =
    await VolunteerAssignment.create({
      incident: incidentId,
      volunteer: volunteer._id,
      assignedBy,
      task,
      notes: notes || null,
      status: "Assigned",
    });

  await writeAuditLog({
    actor: assignedBy,
    assignmentId:
      assignment._id,
    action:
      "VOLUNTEER_ASSIGNMENT_CREATED",
    metadata: {
      incidentId,
      volunteerId:
        volunteer._id,
      assignedBy,
      task: task || null,
      status:
        assignment.status,
    },
  });

  return assignment;
};

export const getAllVolunteerAssignments =
  async () => {
    const assignments =
      await VolunteerAssignment.find()
        .populate(
          "incident",
          "title type normalizedType priority status"
        )
        .populate(
          "volunteer",
          "name email phone role skills availability"
        )
        .populate(
          "assignedBy",
          "name email role"
        )
        .sort({
          createdAt: -1,
        });

    return assignments;
  };

export const getVolunteerAssignmentById =
  async (id) => {
    validateAssignmentId(id);

    const assignment =
      await VolunteerAssignment.findById(
        id
      )
        .populate(
          "incident",
          "title type normalizedType priority status"
        )
        .populate(
          "volunteer",
          "name email phone role skills availability"
        )
        .populate(
          "assignedBy",
          "name email role"
        );

    if (!assignment) {
      const error = new Error(
        "Volunteer assignment not found"
      );
      error.statusCode = 404;
      throw error;
    }

    return assignment;
  };

export const getMyVolunteerAssignments =
  async (volunteerId) => {
    const assignments =
      await VolunteerAssignment.find({
        volunteer: volunteerId,
      })
        .populate(
          "incident",
          "title type normalizedType priority status"
        )
        .populate(
          "assignedBy",
          "name email role"
        )
        .sort({
          createdAt: -1,
        });

    return assignments;
  };

export const updateVolunteerAssignment =
  async ({
    id,
    volunteerId,
    status,
    completionNotes,
  }) => {
    validateAssignmentId(id);

    const assignment =
      await VolunteerAssignment.findById(
        id
      );

    if (!assignment) {
      const error = new Error(
        "Volunteer assignment not found"
      );
      error.statusCode = 404;
      throw error;
    }

    if (
      assignment.volunteer.toString() !==
      volunteerId.toString()
    ) {
      const error = new Error(
        "You can update only your own assignments"
      );
      error.statusCode = 403;
      throw error;
    }

    const currentStatus =
      assignment.status;

    const allowedTransitions = {
      Assigned: [
        "Accepted",
        "Rejected",
      ],
      Accepted: [
        "In Progress",
        "Rejected",
      ],
      "In Progress": [
        "Completed",
      ],
    };

    const allowedNextStatuses =
      allowedTransitions[
        currentStatus
      ] || [];

    if (
      !allowedNextStatuses.includes(
        status
      )
    ) {
      const error = new Error(
        `Cannot change assignment from ${currentStatus} to ${status}`
      );
      error.statusCode = 400;
      throw error;
    }

    if (
      status === "Completed" &&
      !completionNotes?.trim()
    ) {
      const error = new Error(
        "Completion notes are required when completing an assignment"
      );
      error.statusCode = 400;
      throw error;
    }

    assignment.status = status;

    if (status === "Accepted") {
      assignment.acceptedAt =
        new Date();
    }

    if (status === "Completed") {
      assignment.completedAt =
        new Date();

      assignment.completionNotes =
        completionNotes.trim();
    }

    if (status === "Rejected") {
      assignment.completionNotes =
        completionNotes?.trim() ||
        null;
    }

    await assignment.save();

    if (
      [
        "Rejected",
        "Completed",
        "Cancelled",
      ].includes(status)
    ) {
      await User.findByIdAndUpdate(
        volunteerId,
        {
          availability:
            "Available",
        }
      );
    }

    if (
      [
        "Accepted",
        "In Progress",
      ].includes(status)
    ) {
      await User.findByIdAndUpdate(
        volunteerId,
        {
          availability:
            "Unavailable",
        }
      );
    }

    await writeAuditLog({
      actor: volunteerId,
      assignmentId:
        assignment._id,
      action:
        "VOLUNTEER_ASSIGNMENT_STATUS_UPDATED",
      metadata: {
        previousStatus:
          currentStatus,
        newStatus:
          status,
        volunteerId,
        completionNotes:
          completionNotes?.trim() ||
          null,
      },
    });

    return assignment;
  };

export const cancelVolunteerAssignment =
  async (
    id,
    cancelledBy = null
  ) => {
    validateAssignmentId(id);

    const assignment =
      await VolunteerAssignment.findById(
        id
      );

    if (!assignment) {
      const error = new Error(
        "Volunteer assignment not found"
      );
      error.statusCode = 404;
      throw error;
    }

    if (
      [
        "Completed",
        "Cancelled",
      ].includes(
        assignment.status
      )
    ) {
      const error = new Error(
        "This assignment can no longer be cancelled"
      );
      error.statusCode = 400;
      throw error;
    }

    const previousStatus =
      assignment.status;

    assignment.status =
      "Cancelled";

    await assignment.save();

    await User.findByIdAndUpdate(
      assignment.volunteer,
      {
        availability:
          "Available",
      }
    );

    await writeAuditLog({
      actor: cancelledBy,
      assignmentId:
        assignment._id,
      action:
        "VOLUNTEER_ASSIGNMENT_CANCELLED",
      metadata: {
        previousStatus,
        newStatus:
          assignment.status,
        volunteerId:
          assignment.volunteer,
      },
    });

    return assignment;
  };