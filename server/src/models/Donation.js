import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    incident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Incident",
      required: true,
      index: true,
    },

    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    donorName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    donorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 150,
      default: null,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },

    razorpayOrderId: {
      type: String,
      default: null,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    razorpaySignature: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "Created",
        "Pending",
        "Paid",
        "Failed",
        "Cancelled",
      ],
      default: "Created",
    },

    paymentVerifiedAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

donationSchema.index(
  { razorpayOrderId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      razorpayOrderId: {
        $type: "string",
      },
    },
  }
);

donationSchema.index(
  { razorpayPaymentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      razorpayPaymentId: {
        $type: "string",
      },
    },
  }
);

const Donation = mongoose.model(
  "Donation",
  donationSchema,
  "donations"
);

export default Donation;