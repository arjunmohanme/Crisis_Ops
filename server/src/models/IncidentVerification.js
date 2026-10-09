import mongoose from "mongoose";

const incidentVerificationSchema = new mongoose.Schema(
  {
    incident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      required: true,
      index: true,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      enum: ["Verified", "Rejected"],
      required: true,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    observedLocation: {
      address: {
        type: String,
        trim: true,
        maxlength: 300,
        default: null,
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

    evidence: [
      {
        type: String,
        trim: true,
        maxlength: 500,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const IncidentVerification = mongoose.model(
  "IncidentVerification",
  incidentVerificationSchema,
  "incidentVerifications"
);

export default IncidentVerification;