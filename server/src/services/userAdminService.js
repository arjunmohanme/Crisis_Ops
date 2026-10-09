import mongoose from "mongoose";

import User from "../models/User.js";
import Organization from "../models/Organization.js";
import { createAuditLog } from "./auditLogService.js";

const validateUserId = (id, fieldName = "user ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(
      `Invalid ${fieldName}`
    );

    error.statusCode = 400;

    throw error;
  }
};

const writeAuditLog = async ({
  actor,
  action,
  userId,
  metadata = {},
}) => {
  try {
    await createAuditLog({
      actor,
      action,
      entityType: "User",
      entityId: userId,
      metadata,
    });
  } catch (error) {
    console.error(
      "User audit log failed:",
      error.message
    );
  }
};

const writeOrganizationAuditLog = async ({
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

const getPendingRoleUsers = async () => {
  const users = await User.find({
    accountStatus: "Pending",
    requestedRole: {
      $in: [
        "Volunteer",
        "Organization",
      ],
    },
  })
    .select(
      "name email phone role requestedRole accountStatus createdAt"
    )
    .sort({ createdAt: 1 });

  return users;
};

export const getPendingApplications = async () => {
  return getPendingRoleUsers();
};

export const approveApplication = async ({
  userId,
  adminId,
}) => {
  validateUserId(
    userId,
    "user ID"
  );

  validateUserId(
    adminId,
    "admin ID"
  );

  const user = await User.findById(
    userId
  );

  if (!user) {
    const error = new Error(
      "User not found"
    );

    error.statusCode = 404;

    throw error;
  }

  if (
    ![
      "Volunteer",
      "Organization",
    ].includes(user.requestedRole)
  ) {
    const error = new Error(
      "This user does not have a privileged role application"
    );

    error.statusCode = 400;

    throw error;
  }

  if (
    user.accountStatus !==
    "Pending"
  ) {
    const error = new Error(
      "Only pending applications can be approved"
    );

    error.statusCode = 400;

    throw error;
  }

  const approvedRole =
    user.requestedRole;

  const previousRole =
    user.role;

  const previousStatus =
    user.accountStatus;

  let organization = null;
  let organizationCreated = false;

  if (
    approvedRole ===
    "Organization"
  ) {
    organization =
      await Organization.findOne({
        createdBy: user._id,
      });

    if (organization) {
      organization.status = "Approved";

      await organization.save();
    } else {
      organization =
        await Organization.create({
          name: user.name,
          description:
            "Organization profile created during administrator approval.",
          contactPerson: user.name,
          email: user.email,
          phone:
            user.phone ||
            "Not provided",
          address: "Not provided",
          status: "Approved",
          createdBy: user._id,
        });

      organizationCreated = true;
    }
  }

  try {
    user.role = approvedRole;

    user.accountStatus =
      "Approved";

    user.rejectionReason = null;

    user.reviewedBy = adminId;

    user.reviewedAt = new Date();

    user.isActive = true;

    user.isBlocked = false;

    if (
      approvedRole ===
      "Volunteer"
    ) {
      user.availability =
        "Unavailable";

      user.isFieldVerifier =
        false;
    }

    if (
      approvedRole ===
      "Organization"
    ) {
      user.availability =
        "Unavailable";

      user.isFieldVerifier =
        false;

      user.organization =
        organization._id;
    }

    await user.save();
  } catch (error) {
    if (organizationCreated) {
      await Organization.findByIdAndDelete(
        organization._id
      );
    }

    throw error;
  }

  if (
    approvedRole ===
    "Organization"
  ) {
    await writeOrganizationAuditLog({
      actor: adminId,
      action:
        organizationCreated
          ? "ORGANIZATION_CREATED"
          : "ORGANIZATION_APPROVED",
      organizationId:
        organization._id,
      metadata: {
        applicantId: user._id,
        applicantName: user.name,
        applicantEmail: user.email,
        status: organization.status,
        createdDuringApproval:
          organizationCreated,
      },
    });
  }

  await writeAuditLog({
    actor: adminId,
    action:
      "USER_APPLICATION_APPROVED",
    userId: user._id,
    metadata: {
      previousRole,
      newRole: user.role,
      previousStatus,
      newStatus:
        user.accountStatus,
      requestedRole:
        user.requestedRole,
      applicantName:
        user.name,
      applicantEmail:
        user.email,
      organizationId:
        user.organization || null,
    },
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    requestedRole:
      user.requestedRole,
    accountStatus:
      user.accountStatus,
    reviewedBy:
      user.reviewedBy,
    reviewedAt:
      user.reviewedAt,
    organization:
      user.organization,
  };
};

export const rejectApplication = async ({
  userId,
  adminId,
  rejectionReason,
}) => {
  validateUserId(
    userId,
    "user ID"
  );

  validateUserId(
    adminId,
    "admin ID"
  );

  if (!rejectionReason?.trim()) {
    const error = new Error(
      "Rejection reason is required"
    );

    error.statusCode = 400;

    throw error;
  }

  const user = await User.findById(
    userId
  );

  if (!user) {
    const error = new Error(
      "User not found"
    );

    error.statusCode = 404;

    throw error;
  }

  if (
    ![
      "Volunteer",
      "Organization",
    ].includes(user.requestedRole)
  ) {
    const error = new Error(
      "This user does not have a privileged role application"
    );

    error.statusCode = 400;

    throw error;
  }

  if (
    user.accountStatus !==
    "Pending"
  ) {
    const error = new Error(
      "Only pending applications can be rejected"
    );

    error.statusCode = 400;

    throw error;
  }

  const previousRole =
    user.role;

  const previousStatus =
    user.accountStatus;

  const requestedRole =
    user.requestedRole;

  user.role = "Citizen";

  user.accountStatus =
    "Rejected";

  user.rejectionReason =
    rejectionReason.trim();

  user.reviewedBy = adminId;

  user.reviewedAt = new Date();

  user.isFieldVerifier =
    false;

  user.availability =
    "Unavailable";

  user.organization = null;

  await user.save();

  await writeAuditLog({
    actor: adminId,
    action:
      "USER_APPLICATION_REJECTED",
    userId: user._id,
    metadata: {
      previousRole,
      newRole: user.role,
      previousStatus,
      newStatus:
        user.accountStatus,
      requestedRole,
      rejectionReason:
        user.rejectionReason,
      applicantName:
        user.name,
      applicantEmail:
        user.email,
    },
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    requestedRole:
      user.requestedRole,
    accountStatus:
      user.accountStatus,
    rejectionReason:
      user.rejectionReason,
    reviewedBy:
      user.reviewedBy,
    reviewedAt:
      user.reviewedAt,
    organization:
      user.organization,
  };
};

export const getAllUsers = async () => {
  return User.find({})
    .select("name email phone role requestedRole accountStatus isActive isBlocked skills availability location createdAt")
    .sort({ createdAt: -1 });
};

export const setAccountControl = async ({ userId, adminId, blocked }) => {
  validateUserId(userId, "user ID");
  validateUserId(adminId, "admin ID");

  if (userId.toString() === adminId.toString() && blocked) {
    const error = new Error("Administrators cannot block their own account");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  user.isBlocked = Boolean(blocked);
  user.isActive = !Boolean(blocked);
  await user.save();

  await writeAuditLog({
    actor: adminId,
    action: blocked ? "USER_BLOCKED" : "USER_UNBLOCKED",
    userId: user._id,
    metadata: { isBlocked: user.isBlocked, isActive: user.isActive },
  });

  return user;
};
