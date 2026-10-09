import {
  getAllAuditLogs,
  getAuditLogsByEntity,
} from "../services/auditLogService.js";

export const getAllAuditLogsController = async (
  req,
  res,
  next
) => {
  try {
    const auditLogs = await getAllAuditLogs();

    res.status(200).json({
      success: true,
      count: auditLogs.length,
      auditLogs,
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogsByEntityController = async (
  req,
  res,
  next
) => {
  try {
    const auditLogs = await getAuditLogsByEntity(
      req.params.entityType,
      req.params.entityId
    );

    res.status(200).json({
      success: true,
      count: auditLogs.length,
      auditLogs,
    });
  } catch (error) {
    next(error);
  }
};