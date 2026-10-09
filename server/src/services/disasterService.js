import mongoose from "mongoose";
import Disaster from "../models/Disaster.js";

const normalizeDisasterType = (type) => {
  const value = type.toLowerCase().trim();

  if (
    value.includes("flood") ||
    value.includes("overflow") ||
    value.includes("waterlogging") ||
    value.includes("water logged")
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
    value.includes("volcanic") ||
    value.includes("volcano") ||
    value.includes("eruption")
  ) {
    return "Volcanic Eruption";
  }

  if (
    value.includes("chemical") ||
    value.includes("industrial accident") ||
    value.includes("factory accident") ||
    value.includes("gas leak")
  ) {
    return "Industrial Accident";
  }

  return "Other";
};

const validateDisasterId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error("Invalid disaster ID");
    error.statusCode = 400;
    throw error;
  }
};

export const createDisaster = async ({
  name,
  type,
  description,
  affectedLocations,
  startDate,
  endDate,
  createdBy,
}) => {
  const normalizedType = normalizeDisasterType(type);

  const disaster = await Disaster.create({
    name,
    type,
    normalizedType,
    description,
    affectedLocations,
    startDate,
    endDate: endDate || null,
    createdBy,
  });

  return disaster;
};

export const getAllDisasters = async () => {
  const disasters = await Disaster.find()
    .populate("createdBy", "name email role")
    .sort({ createdAt: -1 });

  return disasters;
};

export const getDisasterById = async (id) => {
  validateDisasterId(id);

  const disaster = await Disaster.findById(id).populate(
    "createdBy",
    "name email role"
  );

  if (!disaster) {
    const error = new Error("Disaster not found");
    error.statusCode = 404;
    throw error;
  }

  return disaster;
};

export const updateDisaster = async (id, updates) => {
  validateDisasterId(id);

  const disaster = await Disaster.findById(id);

  if (!disaster) {
    const error = new Error("Disaster not found");
    error.statusCode = 404;
    throw error;
  }

  if (disaster.status === "Closed") {
    const error = new Error(
      "Closed disasters cannot be modified"
    );
    error.statusCode = 400;
    throw error;
  }

  const allowedFields = [
    "name",
    "type",
    "description",
    "affectedLocations",
    "startDate",
    "endDate",
  ];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      disaster[field] = updates[field];
    }
  }

  if (updates.type !== undefined) {
    disaster.normalizedType = normalizeDisasterType(
      updates.type
    );
  }

  if (updates.status !== undefined) {
    if (updates.status === "Closed") {
      disaster.status = "Closed";

      if (!disaster.endDate) {
        disaster.endDate = new Date();
      }
    }
  }

  if (disaster.endDate && disaster.startDate) {
    if (
      new Date(disaster.endDate) <=
      new Date(disaster.startDate)
    ) {
      const error = new Error(
        "End date must be after start date"
      );
      error.statusCode = 400;
      throw error;
    }
  }

  await disaster.save();

  return disaster;
};