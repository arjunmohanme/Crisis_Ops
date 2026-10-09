import mongoose from "mongoose";

const disasterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      trim: true,
    },

    normalizedType: {
      type: String,
      enum: [
        "Flood",
        "Landslide",
        "Earthquake",
        "Cyclone",
        "Storm",
        "Wildfire",
        "Drought",
        "Tsunami",
        "Volcanic Eruption",
        "Industrial Accident",
        "Other",
      ],
      required: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    affectedLocations: {
      type: [String],
      default: [],
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["Active", "Closed"],
      default: "Active",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Disaster = mongoose.model(
  "Disaster",
  disasterSchema,
  "disasters"
);

export default Disaster;