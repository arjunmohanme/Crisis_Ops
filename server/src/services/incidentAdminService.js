import mongoose from "mongoose";

import Incident from "../models/Incident.js";
import Disaster from "../models/Disaster.js";
import { createAuditLog } from "./auditLogService.js";

const validateIncidentId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid incident ID");
    error.statusCode = 400;
    throw error;
  }
};

const validateDisasterId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid disaster ID");
    error.statusCode = 400;
    throw error;
  }
};

const validateAdminId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid admin ID");
    error.statusCode = 400;
    throw error;
  }
};

const isAllowedStatusTransition = (
  currentStatus,
  nextStatus
) => {
  const transitions = {
    Reported: ["Under Review"],
    "Under Review": [],
    Verified: ["Active"],
    Active: ["Resolved"],
    Resolved: ["Archived"],
    Archived: [],
    Rejected: [],
  };

  return (
    transitions[currentStatus]?.includes(
      nextStatus
    ) || false
  );
};

const getAuditAction = (
  currentStatus,
  nextStatus
) => {
  if (
    currentStatus === "Reported" &&
    nextStatus === "Under Review"
  ) {
    return "INCIDENT_REVIEW_STARTED";
  }

  if (
    currentStatus === "Verified" &&
    nextStatus === "Active"
  ) {
    return "INCIDENT_ACTIVATED";
  }

  if (
    currentStatus === "Active" &&
    nextStatus === "Resolved"
  ) {
    return "INCIDENT_RESOLVED";
  }

  if (nextStatus === "Rejected") {
    return "INCIDENT_REJECTED";
  }

  return "INCIDENT_STATUS_UPDATED";
};

export const updateIncidentOperational = async ({
  incidentId,
  adminId,
  priority,
  status,
  disaster,
  rejectionReason,
  resolutionNotes,
}) => {
  validateIncidentId(incidentId);
  validateAdminId(adminId);

  const incident = await Incident.findById(incidentId);

  if (!incident) {
    const error = new Error("Incident not found");
    error.statusCode = 404;
    throw error;
  }

  if (
    incident.status === "Resolved" ||
    incident.status === "Rejected"
  ) {
    const archivingResolvedIncident =
      incident.status === "Resolved" &&
      status === "Archived";

    if (
      !archivingResolvedIncident &&
      (
        priority !== undefined ||
        status !== undefined ||
        disaster !== undefined ||
        resolutionNotes !== undefined
      )
    ) {
      const error = new Error(
        "Resolved or rejected incidents cannot be modified"
      );
      error.statusCode = 400;
      throw error;
    }
  }

  const previousStatus = incident.status;
  const previousPriority = incident.priority;
  const previousDisaster =
    incident.disaster?.toString() || null;

  if (priority !== undefined) {
    incident.priority = priority;
  }

  if (disaster !== undefined) {
    if (!disaster) {
      incident.disaster = null;
    } else {
      validateDisasterId(disaster);

      const disasterRecord =
        await Disaster.findById(disaster);

      if (!disasterRecord) {
        const error = new Error(
          "Disaster not found"
        );
        error.statusCode = 404;
        throw error;
      }

      if (disasterRecord.status === "Closed") {
        const error = new Error(
          "Cannot associate an incident with a closed disaster"
        );
        error.statusCode = 400;
        throw error;
      }

      incident.disaster = disasterRecord._id;
    }
  }

  if (status !== undefined) {
    if (
      status === "Verified" ||
      status === "Rejected"
    ) {
      const error = new Error(
        "Use the incident verification endpoint to verify or reject an incident"
      );
      error.statusCode = 400;
      throw error;
    }

    if (
      !isAllowedStatusTransition(
        incident.status,
        status
      )
    ) {
      const error = new Error(
        `Invalid incident status transition: ${incident.status} → ${status}`
      );
      error.statusCode = 400;
      throw error;
    }

    incident.status = status;

    if (status === "Rejected") {
      incident.rejectionReason =
        rejectionReason.trim();
    }

    if (status === "Under Review") {
      incident.rejectionReason = null;
    }

    if (status === "Resolved") {
      if (!resolutionNotes?.trim()) {
        const error = new Error(
          "Resolution notes are required when resolving an incident"
        );
        error.statusCode = 400;
        throw error;
      }

      incident.resolutionNotes = resolutionNotes.trim();
      incident.resolvedAt = new Date();
      incident.resolvedBy = adminId;
    }

    if (status === "Archived") {
      if (previousStatus !== "Resolved") {
        const error = new Error(
          "Only resolved incidents can be archived"
        );
        error.statusCode = 400;
        throw error;
      }
    }
  }

  await incident.save();

  const auditChanges = {
    previousStatus,
    newStatus: incident.status,
    previousPriority,
    newPriority: incident.priority,
    previousDisaster,
    newDisaster:
      incident.disaster?.toString() || null,
  };

  const statusChanged =
    previousStatus !== incident.status;

  const priorityChanged =
    previousPriority !== incident.priority;

  const disasterChanged =
    previousDisaster !==
    (incident.disaster?.toString() || null);

  if (
    statusChanged ||
    priorityChanged ||
    disasterChanged
  ) {
    try {
      await createAuditLog({
        actor: adminId,
        action: statusChanged
          ? getAuditAction(
              previousStatus,
              incident.status
            )
          : "INCIDENT_OPERATIONAL_UPDATE",
        entityType: "Incident",
        entityId: incident._id,
        metadata: auditChanges,
      });
    } catch (auditError) {
      console.error(
        "Audit log creation failed:",
        auditError.message
      );
    }
  }

  return incident;
};

export const getIncidentOperationalSummary = async (
  incidentId
) => {
  validateIncidentId(incidentId);

  const incident = await Incident.findById(
    incidentId
  )
    .populate(
      "reportedBy",
      "name email role"
    )
    .populate(
      "disaster",
      "name type normalizedType status"
    );

  if (!incident) {
    const error = new Error("Incident not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    id: incident._id,
    title: incident.title,
    type: incident.type,
    normalizedType: incident.normalizedType,
    priority: incident.priority,
    status: incident.status,
    location: incident.location,
    estimatedPeopleAffected:
      incident.estimatedPeopleAffected,
    rejectionReason:
      incident.rejectionReason,
    requestedResources:
      incident.requestedResources,
    resolutionNotes:
      incident.resolutionNotes,
    resolvedAt:
      incident.resolvedAt,
    resolvedBy:
      incident.resolvedBy,
    reportedBy: incident.reportedBy,
    disaster: incident.disaster,
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt,
  };
};