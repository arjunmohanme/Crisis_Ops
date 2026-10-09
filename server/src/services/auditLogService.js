import mongoose from "mongoose";
import AuditLog from "../models/AuditLog.js";

const validateObjectId = (id, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${fieldName}`);
    error.statusCode = 400;
    throw error;
  }
};

export const createAuditLog = async ({
  actor,
  action,
  entityType,
  entityId,
  metadata = {},
}) => {
  validateObjectId(actor, "actor ID");
  validateObjectId(entityId, "entity ID");

  if (!action?.trim()) {
    const error = new Error("Audit action is required");
    error.statusCode = 400;
    throw error;
  }

  if (!entityType?.trim()) {
    const error = new Error("Entity type is required");
    error.statusCode = 400;
    throw error;
  }

  const auditLog = await AuditLog.create({
    actor,
    action: action.trim(),
    entityType: entityType.trim(),
    entityId,
    metadata,
  });

  return auditLog;
};

export const getAllAuditLogs = async () => {
  const auditLogs = await AuditLog.find()
    .populate("actor", "name email role")
    .sort({ createdAt: -1 });

  return auditLogs;
};

export const getAuditLogsByEntity = async (
  entityType,
  entityId
) => {
  validateObjectId(entityId, "entity ID");

  const auditLogs = await AuditLog.find({
    entityType,
    entityId,
  })
    .populate("actor", "name email role")
    .sort({ createdAt: -1 });

  return auditLogs;
};