import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema(
  {
    disaster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Disaster",
      default: null,
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 150,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    type: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    normalizedType: {
      type: String,
      default: "Other",
    },

    location: {
      address: {
        type: String,
        required: true,
        trim: true,
        maxlength: 300,
      },

      latitude: {
        type: Number,
        min: -90,
        max: 90,
        default: null,
      },

      longitude: {
        type: Number,
        min: -180,
        max: 180,
        default: null,
      },
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: [
        "Reported",
        "Under Review",
        "Verified",
        "Active",
        "Resolved",
        "Archived",
        "Rejected",
      ],
      default: "Reported",
    },

    estimatedPeopleAffected: {
      type: Number,
      min: 0,
      default: 0,
    },

    requestedResources: [
      {
        name: {
          type: String,
          trim: true,
          maxlength: 100,
        },
        quantity: {
          type: Number,
          min: 0,
          default: 0,
        },
        unit: {
          type: String,
          trim: true,
          maxlength: 50,
          default: null,
        },
      },
    ],

    evidence: [
      {
        type: String,
        trim: true,
      },
    ],

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Incident = mongoose.model(
  "Incident",
  incidentSchema,
  "incidents"
);

export default Incident;