import mongoose from "mongoose";

import Incident from "../models/Incident.js";
import IncidentVerification from "../models/IncidentVerification.js";
import { createAuditLog } from "./auditLogService.js";

const validateIncidentId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(
      "Invalid incident ID"
    );

    error.statusCode = 400;

    throw error;
  }
};

const validateVerifier = (user) => {
  if (user.role === "Admin") {
    return;
  }

  const error = new Error(
    "Only administrators can verify or reject incidents"
  );

  error.statusCode = 403;

  throw error;
};

const validateAction = (action) => {
  if (
    !["Verified", "Rejected"].includes(
      action
    )
  ) {
    const error = new Error(
      "Verification action must be Verified or Rejected"
    );

    error.statusCode = 400;

    throw error;
  }
};

export const verifyIncident = async ({
  incidentId,
  verifiedBy,
  action,
  notes,
  observedLocation,
  evidence,
}) => {
  validateIncidentId(incidentId);
  validateVerifier(verifiedBy);
  validateAction(action);

  if (
    action === "Rejected" &&
    !notes?.trim()
  ) {
    const error = new Error(
      "Verification notes are required when rejecting an incident"
    );

    error.statusCode = 400;

    throw error;
  }

  const incident =
    await Incident.findById(
      incidentId
    );

  if (!incident) {
    const error = new Error(
      "Incident not found"
    );

    error.statusCode = 404;

    throw error;
  }

  if (
    ![
      "Reported",
      "Under Review",
    ].includes(incident.status)
  ) {
    const error = new Error(
      "This incident is no longer available for verification"
    );

    error.statusCode = 400;

    throw error;
  }

  const previousStatus =
    incident.status;

  if (incident.status === "Reported") {
    incident.status =
      "Under Review";
  }

  const verification =
    await IncidentVerification.create(
      {
        incident:
          incident._id,
        verifiedBy:
          verifiedBy._id,
        action,
        notes:
          notes?.trim() || null,
        observedLocation:
          observedLocation || {},
        evidence:
          evidence || [],
      }
    );

  if (
    action === "Verified"
  ) {
    incident.status =
      "Verified";

    incident.rejectionReason =
      null;
  }

  if (
    action === "Rejected"
  ) {
    incident.status =
      "Rejected";

    incident.rejectionReason =
      notes.trim();
  }

  await incident.save();

  try {
    await createAuditLog({
      actor:
        verifiedBy._id,
      action:
        action === "Verified"
          ? "INCIDENT_VERIFIED"
          : "INCIDENT_REJECTED",
      entityType:
        "Incident",
      entityId:
        incident._id,
      metadata: {
        verificationId:
          verification._id,
        previousStatus,
        newStatus:
          incident.status,
        notes:
          notes?.trim() ||
          null,
      },
    });
  } catch (
    auditError
  ) {
    console.error(
      "Audit log creation failed:",
      auditError.message
    );
  }

  return {
    incident,
    verification,
  };
};

export const getIncidentVerifications =
  async (incidentId) => {
    validateIncidentId(
      incidentId
    );

    const incident =
      await Incident.findById(
        incidentId
      );

    if (!incident) {
      const error = new Error(
        "Incident not found"
      );

      error.statusCode = 404;

      throw error;
    }

    const verifications =
      await IncidentVerification.find(
        {
          incident:
            incidentId,
        }
      )
        .populate(
          "verifiedBy",
          "name email role isFieldVerifier"
        )
        .sort({
          createdAt: -1,
        });

    return verifications;
  };