import mongoose from "mongoose";
import User from "../models/User.js";

const validateVolunteerId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(
      "Invalid volunteer ID"
    );
    error.statusCode = 400;
    throw error;
  }
};

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const parseList = (value) => {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const ensureVolunteer = async (id) => {
  validateVolunteerId(id);

  const volunteer = await User.findById(id);

  if (!volunteer) {
    const error = new Error(
      "Volunteer not found"
    );
    error.statusCode = 404;
    throw error;
  }

  if (volunteer.role !== "Volunteer") {
    const error = new Error(
      "Selected user is not a Volunteer"
    );
    error.statusCode = 400;
    throw error;
  }

  return volunteer;
};

export const getAllVolunteers = async (
  filters = {}
) => {
  const {
    search,
    availability,
    skills,
    isFieldVerifier,
    isActive,
    organizationId,
  } = filters;

  const query = {
    role: "Volunteer",
  };

  if (search) {
    const searchRegex = new RegExp(
      escapeRegex(search.trim()),
      "i"
    );

    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
  }

  if (availability) {
    if (
      !["Available", "Unavailable"].includes(
        availability
      )
    ) {
      const error = new Error(
        "Invalid availability filter"
      );
      error.statusCode = 400;
      throw error;
    }

    query.availability = availability;
  }

  const skillList = parseList(skills);

  if (skillList.length > 0) {
    query.skills = {
      $all: skillList.map(
        (skill) =>
          new RegExp(
            `^${escapeRegex(skill)}$`,
            "i"
          )
      ),
    };
  }

  if (isFieldVerifier !== undefined) {
    if (
      !["true", "false"].includes(
        String(isFieldVerifier).toLowerCase()
      )
    ) {
      const error = new Error(
        "isFieldVerifier must be true or false"
      );
      error.statusCode = 400;
      throw error;
    }

    query.isFieldVerifier =
      String(isFieldVerifier).toLowerCase() ===
      "true";
  }

  if (isActive !== undefined) {
    if (
      !["true", "false"].includes(
        String(isActive).toLowerCase()
      )
    ) {
      const error = new Error(
        "isActive must be true or false"
      );
      error.statusCode = 400;
      throw error;
    }

    query.isActive =
      String(isActive).toLowerCase() ===
      "true";
  }

  if (organizationId) {
    if (
      !mongoose.Types.ObjectId.isValid(
        organizationId
      )
    ) {
      const error = new Error(
        "Invalid organization ID"
      );
      error.statusCode = 400;
      throw error;
    }

    query.organization = organizationId;
  }

  const volunteers = await User.find(query)
    .select(
      "name email phone skills availability isActive isBlocked isFieldVerifier organization createdAt updatedAt"
    )
    .populate(
      "organization",
      "name status email phone"
    )
    .sort({ createdAt: -1 });

  return volunteers;
};

export const getVolunteerById = async (id) => {
  const volunteer = await ensureVolunteer(id);

  return volunteer;
};

export const updateVolunteerProfile = async ({
  id,
  updates,
}) => {
  const volunteer = await ensureVolunteer(id);

  const allowedFields = [
    "name",
    "phone",
    "skills",
    "availability",
  ];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      volunteer[field] = updates[field];
    }
  }

  await volunteer.save();

  return volunteer;
};

export const updateVolunteerByAdmin = async ({
  id,
  updates,
}) => {
  const volunteer = await ensureVolunteer(id);

  const allowedFields = [
    "isFieldVerifier",
    "isActive",
    "isBlocked",
    "availability",
  ];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      volunteer[field] = updates[field];
    }
  }

  if (
    volunteer.isBlocked ||
    !volunteer.isActive
  ) {
    volunteer.availability = "Unavailable";
  }

  await volunteer.save();

  return volunteer;
};

export const getAvailableVolunteers = async () => {
  const volunteers = await User.find({
    role: "Volunteer",
    isActive: true,
    isBlocked: false,
    availability: "Available",
  })
    .select(
      "name email phone skills availability isFieldVerifier"
    )
    .sort({ name: 1 });

  return volunteers;
};