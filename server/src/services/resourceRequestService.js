import mongoose from "mongoose";

import ResourceRequest from "../models/ResourceRequest.js";
import Allocation from "../models/Allocation.js";
import Incident from "../models/Incident.js";
import Resource from "../models/Resource.js";
import Organization from "../models/Organization.js";
import { createAuditLog } from "./auditLogService.js";

const validateResourceRequestId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(
      "Invalid resource request ID"
    );
    error.statusCode = 400;
    throw error;
  }
};

const validateIncidentId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(
      "Invalid incident ID"
    );
    error.statusCode = 400;
    throw error;
  }
};

const validateResourceId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(
      "Invalid resource ID"
    );
    error.statusCode = 400;
    throw error;
  }
};

const validateRequester = async (
  userId,
  role
) => {
  const allowedRoles = [
    "Admin",
    "Organization",
    "Volunteer",
  ];

  if (!allowedRoles.includes(role)) {
    const error = new Error(
      "You are not authorized to create resource requests"
    );
    error.statusCode = 403;
    throw error;
  }

  if (role === "Organization") {
    const organization =
      await Organization.findOne({
        createdBy: userId,
      });

    if (!organization) {
      const error = new Error(
        "Organization profile not found"
      );
      error.statusCode = 404;
      throw error;
    }

    if (
      organization.status !==
      "Approved"
    ) {
      const error = new Error(
        "Only approved organizations can create resource requests"
      );
      error.statusCode = 403;
      throw error;
    }
  }
};

const ensureRequestAccess = async ({
  resourceRequest,
  userId,
  role,
}) => {
  if (role === "Admin") {
    return;
  }

  if (
    role === "Organization" &&
    resourceRequest.resource?.organization
  ) {
    const organization = await Organization.findOne({
      _id: resourceRequest.resource.organization,
      createdBy: userId,
      status: "Approved",
    });

    if (organization) {
      return;
    }
  }

  if (
    !resourceRequest.requestedBy ||
    resourceRequest.requestedBy.toString() !==
      userId.toString()
  ) {
    const error = new Error(
      "You do not have permission to access this resource request"
    );
    error.statusCode = 403;
    throw error;
  }
};

const populateRequest = (query) =>
  query
    .populate(
      "incident",
      "title type normalizedType priority status"
    )
    .populate(
      "resource",
      "name category unit availableQuantity status organization"
    )
    .populate(
      "requestedBy",
      "name email role"
    )
    ;

const writeAuditLog = async ({
  actor,
  action,
  requestId,
  metadata = {},
}) => {
  try {
    await createAuditLog({
      actor,
      action,
      entityType: "ResourceRequest",
      entityId: requestId,
      metadata,
    });
  } catch (error) {
    console.error(
      "Resource request audit log failed:",
      error.message
    );
  }
};

export const createResourceRequest =
  async ({
    incidentId,
    resourceId,
    requestedBy,
    role,
    requestedQuantity,
    reason,
  }) => {
    validateIncidentId(
      incidentId
    );

    validateResourceId(
      resourceId
    );

    await validateRequester(
      requestedBy,
      role
    );

    if (
      !Number.isFinite(
        requestedQuantity
      ) ||
      requestedQuantity <= 0
    ) {
      const error = new Error(
        "Requested quantity must be greater than zero"
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
        "Verified",
        "Active",
      ].includes(
        incident.status
      )
    ) {
      const error = new Error(
        "Resources can only be requested for verified or active incidents"
      );
      error.statusCode = 400;
      throw error;
    }

    const resource =
      await Resource.findById(
        resourceId
      );

    if (!resource) {
      const error = new Error(
        "Resource not found"
      );
      error.statusCode = 404;
      throw error;
    }

    if (
      resource.status ===
      "Inactive"
    ) {
      const error = new Error(
        "Inactive resources cannot be requested"
      );
      error.statusCode = 400;
      throw error;
    }

    const existingRequest =
      await ResourceRequest.findOne({
        incident: incidentId,
        resource: resourceId,
        requestedBy,
        status: {
          $in: [
            "Pending",
            "Partially Fulfilled",
          ],
        },
      });

    if (existingRequest) {
      const error = new Error(
        "An active request already exists for this incident and resource"
      );
      error.statusCode = 409;
      throw error;
    }

    const resourceRequest =
      await ResourceRequest.create({
        incident: incidentId,
        resource: resourceId,
        requestedBy,
        requestedQuantity,
        reason: reason || null,
      });

    await writeAuditLog({
      actor: requestedBy,
      action:
        "RESOURCE_REQUEST_CREATED",
      requestId:
        resourceRequest._id,
      metadata: {
        incidentId,
        resourceId,
        requestedQuantity,
        reason:
          reason || null,
        role,
      },
    });

    return resourceRequest;
  };

export const getAllResourceRequests =
  async ({ userId, role } = {}) => {
    let filter = {};

    if (role === "Organization") {
      const organization = await Organization.findOne({
        createdBy: userId,
        status: "Approved",
      });

      if (!organization) {
        const error = new Error(
          "Organization profile not found or not approved"
        );
        error.statusCode = 403;
        throw error;
      }

      const resourceIds = await Resource.find({
        organization: organization._id,
      }).distinct("_id");

      filter = {
        resource: { $in: resourceIds },
      };
    }

    const requests =
      await populateRequest(
        ResourceRequest.find(filter)
      ).sort({
        createdAt: -1,
      });

    return requests;
  };

export const getResourceRequestById =
  async ({
    id,
    userId,
    role,
  }) => {
    validateResourceRequestId(
      id
    );

    const resourceRequest =
      await populateRequest(
        ResourceRequest.findById(id)
      );

    if (!resourceRequest) {
      const error = new Error(
        "Resource request not found"
      );
      error.statusCode = 404;
      throw error;
    }

    await ensureRequestAccess({
      resourceRequest,
      userId,
      role,
    });

    return resourceRequest;
  };

export const getMyResourceRequests =
  async (userId) => {
    const requests =
      await populateRequest(
        ResourceRequest.find({
          requestedBy: userId,
        })
      ).sort({
        createdAt: -1,
      });

    return requests;
  };


export const updateResourceRequestFulfillment =
  async ({ id, userId, role }) => {
    validateResourceRequestId(id);

    if (!["Admin", "Organization"].includes(role)) {
      const error = new Error(
        "Only administrators or organizations can update resource fulfillment"
      );
      error.statusCode = 403;
      throw error;
    }

    const resourceRequest =
      await populateRequest(
        ResourceRequest.findById(id)
      );

    if (!resourceRequest) {
      const error = new Error(
        "Resource request not found"
      );
      error.statusCode = 404;
      throw error;
    }

    await ensureRequestAccess({
      resourceRequest,
      userId,
      role,
    });

    const allocations = await Allocation.find({
      resourceRequest: id,
      status: {
        $in: ["Allocated", "Fulfilled"],
      },
    }).select("allocatedQuantity");

    const fulfilledQuantity = allocations.reduce(
      (total, allocation) =>
        total + Number(allocation.allocatedQuantity || 0),
      0
    );

    const cappedFulfilled = Math.min(
      resourceRequest.requestedQuantity,
      fulfilledQuantity
    );

    resourceRequest.fulfilledQuantity =
      cappedFulfilled;

    resourceRequest.status =
      cappedFulfilled >= resourceRequest.requestedQuantity
        ? "Fulfilled"
        : cappedFulfilled > 0
          ? "Partially Fulfilled"
          : "Pending";

    await resourceRequest.save();

    await writeAuditLog({
      actor: userId,
      action: "RESOURCE_REQUEST_FULFILLMENT_SYNCED",
      requestId: resourceRequest._id,
      metadata: {
        fulfilledQuantity: cappedFulfilled,
        status: resourceRequest.status,
      },
    });

    return populateRequest(
      ResourceRequest.findById(resourceRequest._id)
    );
  };

export const reviewResourceRequest = async () => {
  const error = new Error(
    "Resource request approval/rejection is not part of the SRS workflow"
  );
  error.statusCode = 400;
  throw error;
};

export const cancelResourceRequest = async () => {
  const error = new Error(
    "Resource request cancellation is not part of the SRS workflow"
  );
  error.statusCode = 400;
  throw error;
};
