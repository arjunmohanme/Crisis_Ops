import Incident from "../models/Incident.js";
import Organization from "../models/Organization.js";
import Resource from "../models/Resource.js";
import ResourceRequest from "../models/ResourceRequest.js";
import Allocation from "../models/Allocation.js";
import VolunteerAssignment from "../models/VolunteerAssignment.js";
import Donation from "../models/Donation.js";
import User from "../models/User.js";

const getAdminDashboard = async () => {
  const [
    totalIncidents,
    pendingVerification,
    activeIncidents,
    totalOrganizations,
    pendingOrganizations,
    totalResources,
    totalVolunteers,
    totalDonations,
    paidDonations,
    pendingApplications,
  ] = await Promise.all([
    Incident.countDocuments(),

    Incident.countDocuments({
      status: {
        $in: ["Reported", "Under Review"],
      },
    }),

    Incident.countDocuments({
      status: "Active",
    }),

    Organization.countDocuments(),

    Organization.countDocuments({
      status: "Pending",
    }),

    Resource.countDocuments(),

    User.countDocuments({
      role: "Volunteer",
    }),

    Donation.countDocuments(),

    Donation.aggregate([
      {
        $match: {
          status: "Paid",
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: {
            $sum: "$amount",
          },
        },
      },
    ]),

    User.countDocuments({
      accountStatus: "Pending",
      requestedRole: {
        $in: [
          "Volunteer",
          "Organization",
        ],
      },
    }),
  ]);

  return {
    role: "Admin",

    incidents: {
      total: totalIncidents,
      pendingVerification,
      active: activeIncidents,
    },

    organizations: {
      total: totalOrganizations,
      pending: pendingOrganizations,
    },

    resources: {
      total: totalResources,
    },

    volunteers: {
      total: totalVolunteers,
    },

    applications: {
      pending: pendingApplications,
    },

    donations: {
      total: totalDonations,
      paidAmount:
        paidDonations[0]?.totalAmount || 0,
    },
  };
};

const getOrganizationDashboard = async (
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

  const organizationResources =
    await Resource.find({
      organization:
        organization._id,
    }).select("_id");

  const resourceIds =
    organizationResources.map(
      (resource) => resource._id
    );

  const [
    resources,
    pendingRequests,
    partiallyFulfilledRequests,
    fulfilledRequests,
    allocations,
  ] = await Promise.all([
    Resource.countDocuments({
      organization:
        organization._id,
    }),

    ResourceRequest.countDocuments({
      resource: {
        $in: resourceIds,
      },
      status: "Pending",
    }),

    ResourceRequest.countDocuments({
      resource: {
        $in: resourceIds,
      },
      status: "Partially Fulfilled",
    }),

    ResourceRequest.countDocuments({
      resource: {
        $in: resourceIds,
      },
      status: "Fulfilled",
    }),

    Allocation.countDocuments({
      resource: {
        $in: resourceIds,
      },
      status: {
        $in: [
          "Allocated",
          "Fulfilled",
        ],
      },
    }),
  ]);

  return {
    role: "Organization",

    organization: {
      id: organization._id,
      name: organization.name,
      status: organization.status,
    },

    resources: {
      total: resources,
    },

    resourceRequests: {
      pending: pendingRequests,
      partiallyFulfilled: partiallyFulfilledRequests,
      fulfilled: fulfilledRequests,
    },

    allocations: {
      active: allocations,
    },
  };
};

const getVolunteerDashboard = async (
  userId
) => {
  const [
    totalAssignments,
    activeAssignments,
    completedAssignments,
  ] = await Promise.all([
    VolunteerAssignment.countDocuments({
      volunteer: userId,
    }),

    VolunteerAssignment.countDocuments({
      volunteer: userId,
      status: {
        $in: [
          "Assigned",
          "Accepted",
          "In Progress",
        ],
      },
    }),

    VolunteerAssignment.countDocuments({
      volunteer: userId,
      status: "Completed",
    }),
  ]);

  const volunteer =
    await User.findById(
      userId
    ).select(
      "name email skills availability isFieldVerifier isActive isBlocked"
    );

  if (!volunteer) {
    const error = new Error(
      "Volunteer not found"
    );

    error.statusCode = 404;

    throw error;
  }

  return {
    role: "Volunteer",

    profile: {
      name: volunteer.name,
      email: volunteer.email,
      skills: volunteer.skills,
      availability:
        volunteer.availability,
      isFieldVerifier:
        volunteer.isFieldVerifier,
      isActive:
        volunteer.isActive,
      isBlocked:
        volunteer.isBlocked,
    },

    assignments: {
      total: totalAssignments,
      active: activeAssignments,
      completed:
        completedAssignments,
    },
  };
};

const getCitizenDashboard = async (
  userId
) => {
  const [
    totalIncidents,
    activeIncidents,
    resolvedIncidents,
    totalDonations,
    paidDonationData,
  ] = await Promise.all([
    Incident.countDocuments({
      reportedBy: userId,
    }),

    Incident.countDocuments({
      reportedBy: userId,
      status: "Active",
    }),

    Incident.countDocuments({
      reportedBy: userId,
      status: "Resolved",
    }),

    Donation.countDocuments({
      donor: userId,
    }),

    Donation.aggregate([
      {
        $match: {
          donor: userId,
          status: "Paid",
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: {
            $sum: "$amount",
          },
        },
      },
    ]),
  ]);

  return {
    role: "Citizen",

    incidents: {
      total: totalIncidents,
      active: activeIncidents,
      resolved: resolvedIncidents,
    },

    donations: {
      total: totalDonations,
      paidAmount:
        paidDonationData[0]
          ?.totalAmount || 0,
    },
  };
};

export const getDashboard = async ({
  userId,
  role,
}) => {
  if (role === "Admin") {
    return getAdminDashboard();
  }

  if (role === "Organization") {
    return getOrganizationDashboard(
      userId
    );
  }

  if (role === "Volunteer") {
    return getVolunteerDashboard(
      userId
    );
  }

  return getCitizenDashboard(
    userId
  );
};