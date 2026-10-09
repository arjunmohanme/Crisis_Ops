import mongoose from "mongoose";

import Resource from "../models/Resource.js";
import ResourceRequest from "../models/ResourceRequest.js";
import Allocation from "../models/Allocation.js";
import Organization from "../models/Organization.js";
import { createAuditLog } from "./auditLogService.js";

const validateResourceId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(
      "Invalid resource ID"
    );
    error.statusCode = 400;
    throw error;
  }
};

const validateOrganizationId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(
      "Invalid organization ID"
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

const getOrganizationForUser = async (
  organizationId,
  userId,
  role
) => {
  validateOrganizationId(
    organizationId
  );

  const organization =
    await Organization.findById(
      organizationId
    );

  if (!organization) {
    const error = new Error(
      "Organization not found"
    );
    error.statusCode = 404;
    throw error;
  }

  if (
    organization.status !==
    "Approved"
  ) {
    const error = new Error(
      "Only approved organizations can manage resources"
    );
    error.statusCode = 403;
    throw error;
  }

  if (
    role !== "Admin" &&
    organization.createdBy.toString() !==
      userId.toString()
  ) {
    const error = new Error(
      "You are not authorized to manage this organization"
    );
    error.statusCode = 403;
    throw error;
  }

  return organization;
};

const escapeRegex = (value) => {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

const validatePagination = (
  page,
  limit
) => {
  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  if (
    !Number.isInteger(
      pageNumber
    ) ||
    pageNumber < 1
  ) {
    const error = new Error(
      "page must be a positive integer"
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    !Number.isInteger(
      limitNumber
    ) ||
    limitNumber < 1 ||
    limitNumber > 100
  ) {
    const error = new Error(
      "limit must be an integer between 1 and 100"
    );
    error.statusCode = 400;
    throw error;
  }

  return {
    pageNumber,
    limitNumber,
  };
};

const writeAuditLog = async ({
  actor,
  action,
  resourceId,
  metadata = {},
}) => {
  try {
    await createAuditLog({
      actor,
      action,
      entityType: "Resource",
      entityId: resourceId,
      metadata,
    });
  } catch (error) {
    console.error(
      "Resource audit log failed:",
      error.message
    );
  }
};

export const createResource = async ({
  organizationId,
  userId,
  role,
  createdBy,
  name,
  category,
  description,
  unit,
  totalQuantity,
}) => {
  await getOrganizationForUser(
    organizationId,
    userId,
    role
  );

  if (totalQuantity < 0) {
    const error = new Error(
      "Total quantity cannot be negative"
    );
    error.statusCode = 400;
    throw error;
  }

  const resource =
    await Resource.create({
      organization:
        organizationId,
      name,
      category,
      description,
      unit,
      totalQuantity,
      availableQuantity:
        totalQuantity,
      reservedQuantity: 0,
      status: getStockStatus(
        totalQuantity,
        totalQuantity
      ),
      createdBy,
    });

  await writeAuditLog({
    actor: createdBy,
    action:
      "RESOURCE_CREATED",
    resourceId:
      resource._id,
    metadata: {
      organizationId,
      name,
      category,
      unit,
      totalQuantity,
      availableQuantity:
        resource.availableQuantity,
      status: resource.status,
    },
  });

  return resource;
};

export const getAllResources = async (
  filters = {},
  user = null
) => {
  const {
    search,
    category,
    status,
    organizationId,
    minAvailable,
    maxAvailable,
    page = 1,
    limit = 20,
  } = filters;

  const {
    pageNumber,
    limitNumber,
  } =
    validatePagination(
      page,
      limit
    );

  const query = {};

  if (user?.role === "Organization") {
    const organization = await Organization.findOne({
      createdBy: user._id,
      status: "Approved",
    });

    if (!organization) {
      const error = new Error(
        "Organization profile not found or not approved"
      );
      error.statusCode = 403;
      throw error;
    }

    if (organizationId && organizationId !== organization._id.toString()) {
      const error = new Error(
        "You are not authorized to view another organization's resources"
      );
      error.statusCode = 403;
      throw error;
    }

    query.organization = organization._id;
  }

  if (search) {
    const searchRegex =
      new RegExp(
        escapeRegex(
          search.trim()
        ),
        "i"
      );

    query.$or = [
      {
        name: searchRegex,
      },
      {
        category:
          searchRegex,
      },
      {
        description:
          searchRegex,
      },
      {
        unit: searchRegex,
      },
    ];
  }

  if (category) {
    query.category = {
      $regex: escapeRegex(
        category.trim()
      ),
      $options: "i",
    };
  }

  if (status) {
    const allowedStatuses = [
      "Available",
      "Low Stock",
      "Out of Stock",
      "Inactive",
    ];

    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      const error = new Error(
        `Invalid resource status: ${status}`
      );
      error.statusCode = 400;
      throw error;
    }

    query.status = status;
  }

  if (organizationId) {
    validateOrganizationId(
      organizationId
    );

    query.organization =
      organizationId;
  }

  if (
    minAvailable !==
    undefined
  ) {
    const value =
      Number(
        minAvailable
      );

    if (
      !Number.isFinite(
        value
      ) ||
      value < 0
    ) {
      const error = new Error(
        "minAvailable must be a non-negative number"
      );
      error.statusCode = 400;
      throw error;
    }

    query.availableQuantity = {
      ...(query.availableQuantity ||
        {}),
      $gte: value,
    };
  }

  if (
    maxAvailable !==
    undefined
  ) {
    const value =
      Number(
        maxAvailable
      );

    if (
      !Number.isFinite(
        value
      ) ||
      value < 0
    ) {
      const error = new Error(
        "maxAvailable must be a non-negative number"
      );
      error.statusCode = 400;
      throw error;
    }

    query.availableQuantity = {
      ...(query.availableQuantity ||
        {}),
      $lte: value,
    };
  }

  const skip =
    (pageNumber - 1) *
    limitNumber;

  const [
    resources,
    total,
  ] = await Promise.all([
    Resource.find(query)
      .populate(
        "organization",
        "name email phone status"
      )
      .populate(
        "createdBy",
        "name email role"
      )
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limitNumber),

    Resource.countDocuments(
      query
    ),
  ]);

  return {
    resources,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages:
        Math.ceil(
          total / limitNumber
        ),
    },
  };
};

export const getOrganizationResources =
  async ({
    organizationId,
    userId,
    role,
  }) => {
    const organization =
      await getOrganizationForUser(
        organizationId,
        userId,
        role
      );

    const resources =
      await Resource.find({
        organization:
          organization._id,
      })
        .populate(
          "organization",
          "name email phone status"
        )
        .populate(
          "createdBy",
          "name email role"
        )
        .sort({
          createdAt: -1,
        });

    return resources;
  };

export const getResourceById =
  async (id, user = null) => {
    validateResourceId(id);

    const resource =
      await Resource.findById(
        id
      )
        .populate(
          "organization",
          "name email phone status"
        )
        .populate(
          "createdBy",
          "name email role"
        );

    if (!resource) {
      const error = new Error(
        "Resource not found"
      );
      error.statusCode = 404;
      throw error;
    }

    if (user?.role === "Organization") {
      await getOrganizationForUser(
        resource.organization?._id || resource.organization,
        user._id,
        user.role
      );
    }

    return resource;
  };

export const deleteResource = async ({
  id,
  userId,
  role,
}) => {
  validateResourceId(id);

  const resource = await Resource.findById(id);

  if (!resource) {
    const error = new Error("Resource not found");
    error.statusCode = 404;
    throw error;
  }

  await getOrganizationForUser(
    resource.organization,
    userId,
    role
  );

  const [requestCount, allocationCount] =
    await Promise.all([
      ResourceRequest.countDocuments({ resource: id }),
      Allocation.countDocuments({ resource: id }),
    ]);

  if (requestCount > 0 || allocationCount > 0) {
    const error = new Error(
      "Resource cannot be deleted because request or allocation history exists; deactivate it instead"
    );
    error.statusCode = 400;
    throw error;
  }

  await Resource.deleteOne({ _id: id });

  await writeAuditLog({
    actor: userId,
    action: "RESOURCE_DELETED",
    resourceId: id,
    metadata: {
      name: resource.name,
      organizationId: resource.organization,
    },
  });

  return resource;
};

export const updateResource =
  async ({
    id,
    userId,
    role,
    updates,
  }) => {
    validateResourceId(id);

    const resource =
      await Resource.findById(
        id
      );

    if (!resource) {
      const error = new Error(
        "Resource not found"
      );
      error.statusCode = 404;
      throw error;
    }

    await getOrganizationForUser(
      resource.organization,
      userId,
      role
    );

    const previousValues = {
      name: resource.name,
      category:
        resource.category,
      description:
        resource.description,
      unit: resource.unit,
      totalQuantity:
        resource.totalQuantity,
      availableQuantity:
        resource.availableQuantity,
      reservedQuantity:
        resource.reservedQuantity,
      status: resource.status,
    };

    const allowedFields = [
      "name",
      "category",
      "description",
      "unit",
    ];

    for (const field of allowedFields) {
      if (
        updates[field] !==
        undefined
      ) {
        resource[field] =
          updates[field];
      }
    }

    if (
      updates.totalQuantity !==
      undefined
    ) {
      const newTotal =
        Number(
          updates.totalQuantity
        );

      if (
        !Number.isFinite(
          newTotal
        ) ||
        newTotal <
          resource.reservedQuantity
      ) {
        const error = new Error(
          "Total quantity cannot be less than reserved quantity"
        );
        error.statusCode = 400;
        throw error;
      }

      resource.totalQuantity =
        newTotal;

      resource.availableQuantity =
        newTotal -
        resource.reservedQuantity;
    }

    resource.status =
      getStockStatus(
        resource.availableQuantity,
        resource.totalQuantity
      );

    await resource.save();

    await writeAuditLog({
      actor: userId,
      action:
        "RESOURCE_UPDATED",
      resourceId:
        resource._id,
      metadata: {
        previousValues,
        newValues: {
          name:
            resource.name,
          category:
            resource.category,
          description:
            resource.description,
          unit:
            resource.unit,
          totalQuantity:
            resource.totalQuantity,
          availableQuantity:
            resource.availableQuantity,
          reservedQuantity:
            resource.reservedQuantity,
          status:
            resource.status,
        },
      },
    });

    return resource;
  };

export const deactivateResource =
  async ({
    id,
    userId,
    role,
  }) => {
    validateResourceId(id);

    const resource =
      await Resource.findById(
        id
      );

    if (!resource) {
      const error = new Error(
        "Resource not found"
      );
      error.statusCode = 404;
      throw error;
    }

    await getOrganizationForUser(
      resource.organization,
      userId,
      role
    );

    const previousStatus =
      resource.status;

    resource.status =
      "Inactive";

    await resource.save();

    await writeAuditLog({
      actor: userId,
      action:
        "RESOURCE_DEACTIVATED",
      resourceId:
        resource._id,
      metadata: {
        previousStatus,
        newStatus:
          resource.status,
        resourceName:
          resource.name,
        organizationId:
          resource.organization,
      },
    });

    return resource;
  };