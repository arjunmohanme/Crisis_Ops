import mongoose from "mongoose";

const allocationSchema = new mongoose.Schema(
  {
    resourceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResourceRequest",
      required: true,
      index: true,
    },

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

    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    allocatedQuantity: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["Allocated", "Fulfilled", "Cancelled"],
      default: "Allocated",
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    allocatedAt: {
      type: Date,
      default: Date.now,
    },

    fulfilledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Allocation = mongoose.model(
  "Allocation",
  allocationSchema,
  "allocations"
);

export default Allocation;