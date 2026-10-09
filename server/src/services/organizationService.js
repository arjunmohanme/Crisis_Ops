import mongoose from "mongoose";

import Organization from "../models/Organization.js";
import { createAuditLog } from "./auditLogService.js";

const validateOrganizationId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid organization ID");
    error.statusCode = 400;
    throw error;
  }
};

const writeAuditLog = async ({
  actor,
  action,
  organizationId,
  metadata = {},
}) => {
  try {
    await createAuditLog({
      actor,
      action,
      entityType: "Organization",
      entityId: organizationId,
      metadata,
    });
  } catch (error) {
    console.error(
      "Organization audit log failed:",
      error.message
    );
  }
};

export const createOrganization = async ({
  userId,
  role,
  name,
  description,
  contactPerson,
  email,
  phone,
  address,
}) => {
  if (!["Organization", "Admin"].includes(role)) {
    const error = new Error(
      "Only Organization users or Admin can create an organization"
    );
    error.statusCode = 403;
    throw error;
  }

  if (role === "Organization") {
    const existingOrganization =
      await Organization.findOne({
        createdBy: userId,
      });

    if (existingOrganization) {
      const error = new Error(
        "You already have an organization profile"
      );
      error.statusCode = 409;
      throw error;
    }
  }

  const organization = await Organization.create({
    name,
    description,
    contactPerson,
    email,
    phone,
    address,
    createdBy: userId,
    status:
      role === "Admin"
        ? "Approved"
        : "Pending",
  });

  await writeAuditLog({
    actor: userId,
    action: "ORGANIZATION_CREATED",
    organizationId: organization._id,
    metadata: {
      name: organization.name,
      status: organization.status,
      createdByRole: role,
    },
  });

  return organization;
};

export const getAllOrganizations = async () => {
  const organizations = await Organization.find()
    .populate(
      "createdBy",
      "name email role"
    )
    .sort({ createdAt: -1 });

  return organizations;
};

export const getOrganizationById = async (id) => {
  validateOrganizationId(id);

  const organization =
    await Organization.findById(id).populate(
      "createdBy",
      "name email role"
    );

  if (!organization) {
    const error = new Error(
      "Organization not found"
    );
    error.statusCode = 404;
    throw error;
  }

  return organization;
};

export const getMyOrganization = async (
  userId
) => {
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

  return organization;
};

export const updateOrganization = async (
  id,
  userId,
  role,
  updates
) => {
  validateOrganizationId(id);

  const organization =
    await Organization.findById(id);

  if (!organization) {
    const error = new Error(
      "Organization not found"
    );
    error.statusCode = 404;
    throw error;
  }

  const isAdmin = role === "Admin";

  const isOwner =
    organization.createdBy.toString() ===
    userId.toString();

  if (!isAdmin && !isOwner) {
    const error = new Error(
      "You are not authorized to update this organization"
    );
    error.statusCode = 403;
    throw error;
  }

  const previousStatus =
    organization.status;

  const allowedFields = [
    "name",
    "description",
    "contactPerson",
    "email",
    "phone",
    "address",
  ];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      organization[field] = updates[field];
    }
  }

  if (updates.status !== undefined) {
    if (!isAdmin) {
      const error = new Error(
        "Only Admin can change organization status"
      );
      error.statusCode = 403;
      throw error;
    }

    organization.status = updates.status;
  }

  await organization.save();

  const statusChanged =
    previousStatus !== organization.status;

  let action = "ORGANIZATION_UPDATED";

  if (
    statusChanged &&
    organization.status === "Approved"
  ) {
    action = "ORGANIZATION_APPROVED";
  }

  if (
    statusChanged &&
    organization.status === "Suspended"
  ) {
    action = "ORGANIZATION_SUSPENDED";
  }

  await writeAuditLog({
    actor: userId,
    action,
    organizationId: organization._id,
    metadata: {
      previousStatus,
      newStatus: organization.status,
      updatedByRole: role,
    },
  });

  return organization;
};

export const deleteOrganization = async (
  id,
  userId,
  role
) => {
  validateOrganizationId(id);

  const organization =
    await Organization.findById(id);

  if (!organization) {
    const error = new Error(
      "Organization not found"
    );
    error.statusCode = 404;
    throw error;
  }

  const isAdmin = role === "Admin";

  const isOwner =
    organization.createdBy.toString() ===
    userId.toString();

  if (!isAdmin && !isOwner) {
    const error = new Error(
      "You are not authorized to delete this organization"
    );
    error.statusCode = 403;
    throw error;
  }

  await organization.deleteOne();

  await writeAuditLog({
    actor: userId,
    action: "ORGANIZATION_DELETED",
    organizationId: organization._id,
    metadata: {
      name: organization.name,
      previousStatus: organization.status,
    },
  });

  return {
    message:
      "Organization deleted successfully",
  };
};