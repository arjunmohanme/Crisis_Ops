import mongoose from "mongoose";

const resourceRequestSchema = new mongoose.Schema(
  {
    incident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      required: true,
      index: true,
    },

    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
      required: true,
      index: true,
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    requestedQuantity: {
      type: Number,
      required: true,
      min: 1,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    fulfilledQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Partially Fulfilled",
        "Fulfilled",
      ],
      default: "Pending",
    },

  },
  {
    timestamps: true,
  }
);

resourceRequestSchema.virtual("remainingQuantity").get(function () {
  return Math.max(0, this.requestedQuantity - this.fulfilledQuantity);
});

resourceRequestSchema.set("toJSON", { virtuals: true });

const ResourceRequest = mongoose.model(
  "ResourceRequest",
  resourceRequestSchema,
  "resourceRequests"
);

export default ResourceRequest;