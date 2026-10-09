import mongoose from "mongoose";
import Incident from "../models/Incident.js";
import Disaster from "../models/Disaster.js";

const normalizeIncidentType = (type) => {
  const value = type.toLowerCase().trim();

  if (
    value.includes("flood") ||
    value.includes("waterlogging") ||
    value.includes("water logged") ||
    value.includes("overflow")
  ) {
    return "Flood";
  }

  if (
    value.includes("landslide") ||
    value.includes("land slide") ||
    value.includes("mudslide") ||
    value.includes("rockfall") ||
    value.includes("soil collapse")
  ) {
    return "Landslide";
  }

  if (
    value.includes("earthquake") ||
    value.includes("earth quake") ||
    value.includes("seismic")
  ) {
    return "Earthquake";
  }

  if (
    value.includes("cyclone") ||
    value.includes("hurricane") ||
    value.includes("typhoon")
  ) {
    return "Cyclone";
  }

  if (
    value.includes("storm") ||
    value.includes("tornado") ||
    value.includes("thunderstorm") ||
    value.includes("strong wind")
  ) {
    return "Storm";
  }

  if (
    value.includes("wildfire") ||
    value.includes("forest fire") ||
    value.includes("fire in forest")
  ) {
    return "Wildfire";
  }

  if (
    value.includes("drought") ||
    value.includes("water scarcity")
  ) {
    return "Drought";
  }

  if (
    value.includes("tsunami") ||
    value.includes("tidal wave")
  ) {
    return "Tsunami";
  }

  if (
    value.includes("volcano") ||
    value.includes("volcanic") ||
    value.includes("eruption")
  ) {
    return "Volcanic Eruption";
  }

  if (
    value.includes("chemical") ||
    value.includes("gas leak") ||
    value.includes("industrial accident") ||
    value.includes("factory accident")
  ) {
    return "Industrial Accident";
  }

  if (
    value.includes("building collapse") ||
    value.includes("structure collapse")
  ) {
    return "Building Collapse";
  }

  if (
    value.includes("road accident") ||
    value.includes("traffic accident") ||
    value.includes("vehicle accident")
  ) {
    return "Road Accident";
  }

  return "Other";
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

const validateDisasterId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(
      "Invalid disaster ID"
    );
    error.statusCode = 400;
    throw error;
  }
};

const checkDisasterExists = async (
  disasterId
) => {
  if (!disasterId) {
    return null;
  }

  validateDisasterId(
    disasterId
  );

  const disaster =
    await Disaster.findById(
      disasterId
    );

  if (!disaster) {
    const error = new Error(
      "Disaster not found"
    );
    error.statusCode = 404;
    throw error;
  }

  return disaster;
};

const escapeRegex = (value) =>
  value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

const parseList = (value) => {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const validateFilters = ({
  status,
  priority,
  type,
  fromDate,
  toDate,
  disasterId,
  page,
  limit,
}) => {
  const allowedStatuses = [
    "Reported",
    "Under Review",
    "Verified",
    "Active",
    "Resolved",
    "Archived",
    "Rejected",
  ];

  const allowedPriorities = [
    "Low",
    "Medium",
    "High",
    "Critical",
  ];

  const statusList =
    parseList(status);

  const priorityList =
    parseList(priority);

  const invalidStatus =
    statusList.find(
      (item) =>
        !allowedStatuses.includes(
          item
        )
    );

  if (invalidStatus) {
    const error = new Error(
      `Invalid status filter: ${invalidStatus}`
    );
    error.statusCode = 400;
    throw error;
  }

  const invalidPriority =
    priorityList.find(
      (item) =>
        !allowedPriorities.includes(
          item
        )
    );

  if (invalidPriority) {
    const error = new Error(
      `Invalid priority filter: ${invalidPriority}`
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    fromDate &&
    Number.isNaN(
      new Date(fromDate).getTime()
    )
  ) {
    const error = new Error(
      "Invalid fromDate"
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    toDate &&
    Number.isNaN(
      new Date(toDate).getTime()
    )
  ) {
    const error = new Error(
      "Invalid toDate"
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    fromDate &&
    toDate &&
    new Date(fromDate) >
      new Date(toDate)
  ) {
    const error = new Error(
      "fromDate cannot be later than toDate"
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    disasterId &&
    !mongoose.Types.ObjectId.isValid(
      disasterId
    )
  ) {
    const error = new Error(
      "Invalid disasterId"
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    page !== undefined &&
    (!Number.isInteger(
      Number(page)
    ) ||
      Number(page) < 1)
  ) {
    const error = new Error(
      "page must be a positive integer"
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    limit !== undefined &&
    (!Number.isInteger(
      Number(limit)
    ) ||
      Number(limit) < 1 ||
      Number(limit) > 100)
  ) {
    const error = new Error(
      "limit must be an integer between 1 and 100"
    );
    error.statusCode = 400;
    throw error;
  }

  if (
    type !== undefined &&
    type !== null &&
    typeof type !== "string"
  ) {
    const error = new Error(
      "type must be a string"
    );
    error.statusCode = 400;
    throw error;
  }
};

export const createIncident = async ({
  reportedBy,
  disaster,
  title,
  description,
  type,
  location,
  estimatedPeopleAffected,
  requestedResources,
  priority,
  evidence,
}) => {
  await checkDisasterExists(
    disaster
  );

  const normalizedType =
    normalizeIncidentType(type);

  const incident =
    await Incident.create({
      reportedBy,
      disaster: disaster || null,
      title,
      description,
      type,
      normalizedType,
      location,
      estimatedPeopleAffected:
        estimatedPeopleAffected ?? 0,
      requestedResources:
        requestedResources || [],
      priority: priority || "Medium",
      evidence: evidence || [],
    });

  return incident;
};

export const getAllIncidents = async (
  filters = {},
  user = null
) => {
  const {
    status,
    priority,
    type,
    location,
    search,
    fromDate,
    toDate,
    disasterId,
    page = 1,
    limit = 20,
  } = filters;

  validateFilters({
    status,
    priority,
    type,
    fromDate,
    toDate,
    disasterId,
    page,
    limit,
  });

  const pageNumber =
    Number(page);

  const limitNumber =
    Number(limit);

  const query = {};

  if (user?.role === "Citizen") {
    query.$or = [
      { reportedBy: user._id },
      {
        status: {
          $in: [
            "Verified",
            "Active",
            "Resolved",
            "Archived",
          ],
        },
      },
    ];
  }

  const statusList =
    parseList(status);

  const priorityList =
    parseList(priority);

  if (statusList.length > 0) {
    query.status = {
      $in: statusList,
    };
  }

  if (priorityList.length > 0) {
    query.priority = {
      $in: priorityList,
    };
  }

  const andConditions = [];

  if (type?.trim()) {
    const typeRegex =
      new RegExp(
        escapeRegex(
          type.trim()
        ),
        "i"
      );

    andConditions.push({
      $or: [
        {
          type: typeRegex,
        },
        {
          normalizedType:
            typeRegex,
        },
      ],
    });
  }

  if (search?.trim()) {
    const searchRegex =
      new RegExp(
        escapeRegex(
          search.trim()
        ),
        "i"
      );

    andConditions.push({
      $or: [
        {
          title: searchRegex,
        },
        {
          description:
            searchRegex,
        },
        {
          type: searchRegex,
        },
        {
          normalizedType:
            searchRegex,
        },
        {
          "location.address":
            searchRegex,
        },
      ],
    });
  }

  if (andConditions.length > 0) {
    query.$and =
      andConditions;
  }

  if (location?.trim()) {
    query["location.address"] = {
      $regex: escapeRegex(
        location.trim()
      ),
      $options: "i",
    };
  }

  if (disasterId) {
    query.disaster =
      disasterId;
  }

  if (fromDate || toDate) {
    query.createdAt = {};

    if (fromDate) {
      query.createdAt.$gte =
        new Date(
          `${fromDate}T00:00:00.000Z`
        );
    }

    if (toDate) {
      query.createdAt.$lte =
        new Date(
          `${toDate}T23:59:59.999Z`
        );
    }
  }

  const skip =
    (pageNumber - 1) *
    limitNumber;

  const [
    incidents,
    total,
  ] = await Promise.all([
    Incident.find(query)
      .populate(
        "reportedBy",
        "name email role phone"
      )
      .populate(
        "disaster",
        "name type normalizedType status"
      )
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limitNumber),

    Incident.countDocuments(
      query
    ),
  ]);

  return {
    incidents,
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages:
        Math.ceil(
          total / limitNumber
        ),
    },
    filters: {
      status:
        status || null,
      priority:
        priority || null,
      type: type || null,
      location:
        location || null,
      search:
        search || null,
      fromDate:
        fromDate || null,
      toDate:
        toDate || null,
      disasterId:
        disasterId || null,
    },
  };
};

export const getIncidentById =
  async (id, user = null) => {
    validateIncidentId(id);

    const incident =
      await Incident.findById(
        id
      )
        .populate(
          "reportedBy",
          "name email role phone"
        )
        .populate(
          "disaster",
          "name type normalizedType status"
        );

    if (!incident) {
      const error = new Error(
        "Incident not found"
      );
      error.statusCode = 404;
      throw error;
    }

    if (
      user?.role === "Citizen" &&
      incident.reportedBy?._id?.toString() !== user._id?.toString() &&
      ![
        "Verified",
        "Active",
        "Resolved",
        "Archived",
      ].includes(incident.status)
    ) {
      const error = new Error("Incident not found");
      error.statusCode = 404;
      throw error;
    }

    return incident;
  };

export const getMyIncidents =
  async (userId) => {
    const incidents =
      await Incident.find({
        reportedBy: userId,
      })
        .populate(
          "disaster",
          "name type normalizedType status"
        )
        .sort({
          createdAt: -1,
        });

    return incidents;
  };

export const updateIncident =
  async (
    id,
    userId,
    updates,
    role = "Citizen"
  ) => {
    validateIncidentId(id);

    const incident =
      await Incident.findById(
        id
      );

    if (!incident) {
      const error = new Error(
        "Incident not found"
      );
      error.statusCode = 404;
      throw error;
    }

    if (
      role !== "Admin" &&
      incident.reportedBy.toString() !==
        userId.toString()
    ) {
      const error = new Error(
        "You can update only your own incident"
      );
      error.statusCode = 403;
      throw error;
    }

    if (
      role !== "Admin" &&
      ![
        "Reported",
        "Under Review",
      ].includes(
        incident.status
      )
    ) {
      const error = new Error(
        "This incident can no longer be edited"
      );
      error.statusCode = 400;
      throw error;
    }

    if (
      updates.disaster !==
      undefined
    ) {
      if (
        updates.disaster ===
          null ||
        updates.disaster === ""
      ) {
        incident.disaster =
          null;
      } else {
        await checkDisasterExists(
          updates.disaster
        );

        incident.disaster =
          updates.disaster;
      }
    }

    const allowedFields = [
      "title",
      "description",
      "type",
      "location",
      "estimatedPeopleAffected",
      "requestedResources",
      "priority",
      "evidence",
    ];

    for (const field of allowedFields) {
      if (
        updates[field] !==
        undefined
      ) {
        incident[field] =
          updates[field];
      }
    }

    if (
      updates.type !==
      undefined
    ) {
      incident.normalizedType =
        normalizeIncidentType(
          updates.type
        );
    }

    await incident.save();

    return incident;
  };

export const deleteIncident =
  async (
    id,
    userId,
    role = "Citizen"
  ) => {
    validateIncidentId(id);

    const incident =
      await Incident.findById(
        id
      );

    if (!incident) {
      const error = new Error(
        "Incident not found"
      );
      error.statusCode = 404;
      throw error;
    }

    if (
      role !== "Admin" &&
      incident.reportedBy.toString() !==
      userId.toString()
    ) {
      const error = new Error(
        "You can delete only your own incident"
      );
      error.statusCode = 403;
      throw error;
    }

    if (
      incident.status !==
      "Reported"
    ) {
      const error = new Error(
        "Only reported incidents can be deleted"
      );
      error.statusCode = 400;
      throw error;
    }

    await incident.deleteOne();

    return {
      message:
        "Incident deleted successfully",
    };
  };