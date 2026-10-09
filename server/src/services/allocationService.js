import mongoose from "mongoose";

import Allocation from "../models/Allocation.js";
import ResourceRequest from "../models/ResourceRequest.js";
import Resource from "../models/Resource.js";
import Organization from "../models/Organization.js";
import { createAuditLog } from "./auditLogService.js";

const validateAllocationId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(
      "Invalid allocation ID"
    );
    error.statusCode = 400;
    throw error;
  }
};

const validateResourceRequestId = (
  id
) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(
      "Invalid resource request ID"
    );
    error.statusCode = 400;
    throw error;
  }
};

const getStockStatus = (
  availableQuantity,
  totalQuantity
) => {
  if (availableQuantity === 0) {
    return "Out of Stock";
  }

  if (
    totalQuantity > 0 &&
    availableQuantity <=
      totalQuantity * 0.2
  ) {
    return "Low Stock";
  }

  return "Available";
};

const verifyOrganizationOwnership =
  async (
    organizationId,
    userId
  ) => {
    const organization =
      await Organization.findOne({
        _id: organizationId,
        createdBy: userId,
        status: "Approved",
      });

    if (!organization) {
      const error = new Error(
        "You are not authorized to allocate this organization's resource"
      );
      error.statusCode = 403;
      throw error;
    }

    return organization;
  };

const writeAuditLog = async ({
  actor,
  action,
  allocationId,
  metadata = {},
}) => {
  try {
    await createAuditLog({
      actor,
      action,
      entityType: "Allocation",
      entityId: allocationId,
      metadata,
    });
  } catch (error) {
    console.error(
      "Allocation audit log failed:",
      error.message
    );
  }
};

export const createAllocation = async ({
  resourceRequestId,
  allocatedBy,
  role,
  allocatedQuantity,
  notes,
}) => {
  validateResourceRequestId(
    resourceRequestId
  );

  if (
    !mongoose.Types.ObjectId.isValid(
      allocatedBy
    )
  ) {
    const error = new Error(
      "Invalid allocator ID"
    );
    error.statusCode = 400;
    throw error;
  }

  const quantity = Number(
    allocatedQuantity
  );

  if (
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    const error = new Error(
      "Allocated quantity must be a positive integer"
    );
    error.statusCode = 400;
    throw error;
  }

  const session =
    await mongoose.startSession();

  try {
    let createdAllocation;
    let auditMetadata;

    await session.withTransaction(
      async () => {
        const resourceRequest =
          await ResourceRequest.findById(
            resourceRequestId
          ).session(session);

        if (!resourceRequest) {
          const error = new Error(
            "Resource request not found"
          );
          error.statusCode = 404;
          throw error;
        }

        if (
          !["Pending", "Partially Fulfilled"].includes(
            resourceRequest.status
          )
        ) {
          const error = new Error(
            "Only pending or partially fulfilled resource requests can be allocated"
          );
          error.statusCode = 400;
          throw error;
        }

        const remainingQuantity =
          Math.max(
            0,
            resourceRequest.requestedQuantity -
              resourceRequest.fulfilledQuantity
          );

        if (quantity > remainingQuantity) {
          const error = new Error(
            `Allocated quantity cannot exceed remaining requested quantity (${remainingQuantity})`
          );
          error.statusCode = 400;
          throw error;
        }

        const resource =
          await Resource.findById(
            resourceRequest.resource
          ).session(session);

        if (!resource) {
          const error = new Error(
            "Resource not found"
          );
          error.statusCode = 404;
          throw error;
        }

        if (
          role === "Organization"
        ) {
          const organization =
            await Organization.findOne({
              _id:
                resource.organization,
              createdBy: allocatedBy,
              status: "Approved",
            }).session(session);

          if (!organization) {
            const error = new Error(
              "You are not authorized to allocate this resource"
            );
            error.statusCode = 403;
            throw error;
          }
        }

        if (
          resource.status ===
          "Inactive"
        ) {
          const error = new Error(
            "Inactive resources cannot be allocated"
          );
          error.statusCode = 400;
          throw error;
        }

        if (
          resource.availableQuantity <
          quantity
        ) {
          const error = new Error(
            "Insufficient available resource quantity"
          );
          error.statusCode = 400;
          throw error;
        }

        const previousAvailable =
          resource.availableQuantity;

        const previousReserved =
          resource.reservedQuantity;

        resource.availableQuantity -=
          quantity;

        resource.reservedQuantity +=
          quantity;

        resource.status =
          getStockStatus(
            resource.availableQuantity,
            resource.totalQuantity
          );

        await resource.save({
          session,
        });

        const allocationDocuments =
          await Allocation.create(
            [
              {
                resourceRequest:
                  resourceRequest._id,
                incident:
                  resourceRequest.incident,
                resource:
                  resourceRequest.resource,
                allocatedBy,
                allocatedQuantity:
                  quantity,
                status: "Allocated",
                notes:
                  notes || null,
              },
            ],
            { session }
          );

        createdAllocation =
          allocationDocuments[0];

        resourceRequest.fulfilledQuantity += quantity;
        resourceRequest.status =
          resourceRequest.fulfilledQuantity >= resourceRequest.requestedQuantity
            ? "Fulfilled"
            : "Partially Fulfilled";
        await resourceRequest.save({ session });

        auditMetadata = {
          resourceRequestId:
            resourceRequest._id,
          incidentId:
            resourceRequest.incident,
          resourceId:
            resourceRequest.resource,
          allocatedQuantity:
            quantity,
          previousAvailable,
          newAvailable:
            resource.availableQuantity,
          previousReserved,
          newReserved:
            resource.reservedQuantity,
          status:
            createdAllocation.status,
        };
      }
    );

    await writeAuditLog({
      actor: allocatedBy,
      action:
        "ALLOCATION_CREATED",
      allocationId:
        createdAllocation._id,
      metadata:
        auditMetadata,
    });

    return createdAllocation;
  } finally {
    await session.endSession();
  }
};

export const getAllAllocations =
  async () => {
    return Allocation.find()
      .populate(
        "resourceRequest",
        "requestedQuantity fulfilledQuantity status reason"
      )
      .populate(
        "incident",
        "title type normalizedType priority status"
      )
      .populate(
        "resource",
        "name category unit totalQuantity availableQuantity reservedQuantity status organization"
      )
      .populate(
        "allocatedBy",
        "name email role"
      )
      .sort({
        createdAt: -1,
      });
  };

export const getMyAllocations =
  async (userId) => {
    const organizations =
      await Organization.find({
        createdBy: userId,
        status: "Approved",
      }).select("_id");

    const organizationIds =
      organizations.map(
        (organization) =>
          organization._id
      );

    const resources =
      await Resource.find({
        organization: {
          $in: organizationIds,
        },
      }).select("_id");

    const resourceIds =
      resources.map(
        (resource) =>
          resource._id
      );

    return Allocation.find({
      resource: {
        $in: resourceIds,
      },
    })
      .populate(
        "resourceRequest",
        "requestedQuantity fulfilledQuantity status reason"
      )
      .populate(
        "incident",
        "title type normalizedType priority status"
      )
      .populate(
        "resource",
        "name category unit totalQuantity availableQuantity reservedQuantity status organization"
      )
      .populate(
        "allocatedBy",
        "name email role"
      )
      .sort({
        createdAt: -1,
      });
  };

export const getAllocationById =
  async ({
    id,
    userId,
    role,
  }) => {
    validateAllocationId(id);

    const allocation =
      await Allocation.findById(id)
        .populate(
          "resourceRequest",
          "requestedQuantity fulfilledQuantity status reason"
        )
        .populate(
          "incident",
          "title type normalizedType priority status"
        )
        .populate(
          "resource",
          "name category unit totalQuantity availableQuantity reservedQuantity status organization"
        )
        .populate(
          "allocatedBy",
          "name email role"
        );

    if (!allocation) {
      const error = new Error(
        "Allocation not found"
      );
      error.statusCode = 404;
      throw error;
    }

    if (
      role === "Organization"
    ) {
      await verifyOrganizationOwnership(
        allocation.resource
          .organization,
        userId
      );
    }

    return allocation;
  };

export const fulfillAllocation =
  async (id, fulfilledBy) => {
    validateAllocationId(id);

    if (
      fulfilledBy &&
      !mongoose.Types.ObjectId.isValid(
        fulfilledBy
      )
    ) {
      const error = new Error(
        "Invalid fulfiller ID"
      );
      error.statusCode = 400;
      throw error;
    }

    const session =
      await mongoose.startSession();

    try {
      let allocation;
      let auditMetadata;

      await session.withTransaction(
        async () => {
          allocation =
            await Allocation.findById(
              id
            ).session(session);

          if (!allocation) {
            const error = new Error(
              "Allocation not found"
            );
            error.statusCode = 404;
            throw error;
          }

          if (
            allocation.status !==
            "Allocated"
          ) {
            const error = new Error(
              "Only active allocations can be fulfilled"
            );
            error.statusCode = 400;
            throw error;
          }

          const resource =
            await Resource.findById(
              allocation.resource
            ).session(session);

          if (!resource) {
            const error = new Error(
              "Resource not found"
            );
            error.statusCode = 404;
            throw error;
          }

          if (
            resource.reservedQuantity <
            allocation.allocatedQuantity
          ) {
            const error = new Error(
              "Reserved resource quantity is inconsistent"
            );
            error.statusCode = 400;
            throw error;
          }

          const previousReserved =
            resource.reservedQuantity;

          resource.reservedQuantity -=
            allocation.allocatedQuantity;

          resource.status =
            getStockStatus(
              resource.availableQuantity,
              resource.totalQuantity
            );

          await resource.save({
            session,
          });

          allocation.status =
            "Fulfilled";

          allocation.fulfilledAt =
            new Date();

          await allocation.save({
            session,
          });

          const request = await ResourceRequest.findById(
            allocation.resourceRequest
          ).session(session);

          if (request) {
            request.fulfilledQuantity = Math.min(
              request.requestedQuantity,
              Math.max(0, request.fulfilledQuantity || 0)
            );
            request.status =
              request.fulfilledQuantity >= request.requestedQuantity
                ? "Fulfilled"
                : "Partially Fulfilled";
            await request.save({ session });
          }

          auditMetadata = {
            previousStatus:
              "Allocated",
            newStatus:
              "Fulfilled",
            resourceId:
              allocation.resource,
            resourceRequestId:
              allocation.resourceRequest,
            allocatedQuantity:
              allocation.allocatedQuantity,
            previousReserved,
            newReserved:
              resource.reservedQuantity,
          };
        }
      );

      await writeAuditLog({
        actor:
          fulfilledBy ||
          allocation.allocatedBy,
        action:
          "ALLOCATION_FULFILLED",
        allocationId:
          allocation._id,
        metadata:
          auditMetadata,
      });

      return allocation;
    } finally {
      await session.endSession();
    }
  };

export const cancelAllocation =
  async (id, cancelledBy) => {
    validateAllocationId(id);

    if (
      cancelledBy &&
      !mongoose.Types.ObjectId.isValid(
        cancelledBy
      )
    ) {
      const error = new Error(
        "Invalid canceller ID"
      );
      error.statusCode = 400;
      throw error;
    }

    const session =
      await mongoose.startSession();

    try {
      let allocation;
      let auditMetadata;

      await session.withTransaction(
        async () => {
          allocation =
            await Allocation.findById(
              id
            ).session(session);

          if (!allocation) {
            const error = new Error(
              "Allocation not found"
            );
            error.statusCode = 404;
            throw error;
          }

          if (
            allocation.status !==
            "Allocated"
          ) {
            const error = new Error(
              "Only active allocations can be cancelled"
            );
            error.statusCode = 400;
            throw error;
          }

          const resource =
            await Resource.findById(
              allocation.resource
            ).session(session);

          if (!resource) {
            const error = new Error(
              "Resource not found"
            );
            error.statusCode = 404;
            throw error;
          }

          if (
            resource.reservedQuantity <
            allocation.allocatedQuantity
          ) {
            const error = new Error(
              "Reserved resource quantity is inconsistent"
            );
            error.statusCode = 400;
            throw error;
          }

          const previousAvailable =
            resource.availableQuantity;

          const previousReserved =
            resource.reservedQuantity;

          resource.availableQuantity +=
            allocation.allocatedQuantity;

          resource.reservedQuantity -=
            allocation.allocatedQuantity;

          resource.status =
            getStockStatus(
              resource.availableQuantity,
              resource.totalQuantity
            );

          await resource.save({
            session,
          });

          allocation.status =
            "Cancelled";

          await allocation.save({
            session,
          });

          const request = await ResourceRequest.findById(
            allocation.resourceRequest
          ).session(session);

          if (request) {
            request.fulfilledQuantity = Math.max(
              0,
              (request.fulfilledQuantity || 0) -
                allocation.allocatedQuantity
            );
            request.status =
              request.fulfilledQuantity >= request.requestedQuantity
                ? "Fulfilled"
                : request.fulfilledQuantity > 0
                  ? "Partially Fulfilled"
                  : "Pending";
            await request.save({ session });
          }

          auditMetadata = {
            previousStatus:
              "Allocated",
            newStatus:
              "Cancelled",
            resourceId:
              allocation.resource,
            resourceRequestId:
              allocation.resourceRequest,
            allocatedQuantity:
              allocation.allocatedQuantity,
            previousAvailable,
            newAvailable:
              resource.availableQuantity,
            previousReserved,
            newReserved:
              resource.reservedQuantity,
          };
        }
      );

      await writeAuditLog({
        actor:
          cancelledBy ||
          allocation.allocatedBy,
        action:
          "ALLOCATION_CANCELLED",
        allocationId:
          allocation._id,
        metadata:
          auditMetadata,
      });

      return allocation;
    } finally {
      await session.endSession();
    }
  };