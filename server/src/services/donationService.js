import crypto from "crypto";
import mongoose from "mongoose";
import Razorpay from "razorpay";

import Donation from "../models/Donation.js";
import Incident from "../models/Incident.js";
import { createAuditLog } from "./auditLogService.js";

if (
  !process.env.RAZORPAY_KEY_ID ||
  !process.env.RAZORPAY_KEY_SECRET
) {
  throw new Error(
    "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required in server/.env"
  );
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret:
    process.env.RAZORPAY_KEY_SECRET,
});

const validateIncidentId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(
      "Invalid incident ID"
    );

    error.statusCode = 400;

    throw error;
  }
};

const validateDonationId = (id) => {
  if (
    !mongoose.Types.ObjectId.isValid(id)
  ) {
    const error = new Error(
      "Invalid donation ID"
    );

    error.statusCode = 400;

    throw error;
  }
};

const validateAmount = (amount) => {
  const value = Number(amount);

  if (
    !Number.isFinite(value) ||
    value < 1
  ) {
    const error = new Error(
      "Donation amount must be at least 1"
    );

    error.statusCode = 400;

    throw error;
  }

  return value;
};

const writeAuditLog = async ({
  actor,
  action,
  donationId,
  metadata = {},
}) => {
  if (!actor || !donationId) {
    return;
  }

  try {
    await createAuditLog({
      actor,
      action,
      entityType: "Donation",
      entityId: donationId,
      metadata,
    });
  } catch (error) {
    console.error(
      "Donation audit log failed:",
      error.message
    );
  }
};

export const getDonationEligibleIncidents =
  async () => {
    return Incident.find({
      status: {
        $in: [
          "Verified",
          "Active",
        ],
      },
    })
      .select(
        "title type normalizedType priority status createdAt"
      )
      .sort({
        createdAt: -1,
      });
  };

export const createDonationOrder =
  async ({
    incidentId,
    donorId,
    donorName,
    donorEmail,
    amount,
    notes,
  }) => {
    validateIncidentId(incidentId);

    const donationAmount =
      validateAmount(amount);

    const incident =
      await Incident.findById(
        incidentId
      );

    if (!incident) {
      const error = new Error(
        "Incident not found"
      );

      error.statusCode = 404;

      throw error;
    }

    if (
      ![
        "Verified",
        "Active",
      ].includes(incident.status)
    ) {
      const error = new Error(
        "Donations are allowed only for verified or active incidents"
      );

      error.statusCode = 400;

      throw error;
    }

    const amountInPaise =
      Math.round(
        donationAmount * 100
      );

    const razorpayOrder =
      await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `donation_${Date.now()}`,
      });

    const donation =
      await Donation.create({
        incident: incidentId,
        donor: donorId || null,
        donorName:
          donorName || null,
        donorEmail:
          donorEmail || null,
        amount: donationAmount,
        currency: "INR",
        razorpayOrderId:
          razorpayOrder.id,
        status: "Pending",
        notes: notes || null,
      });

    await writeAuditLog({
      actor: donorId,
      action:
        "DONATION_ORDER_CREATED",
      donationId:
        donation._id,
      metadata: {
        incidentId,
        amount:
          donationAmount,
        currency: "INR",
        razorpayOrderId:
          razorpayOrder.id,
        status:
          donation.status,
      },
    });

    return {
      donation,
      order: {
        id: razorpayOrder.id,
        amount:
          razorpayOrder.amount,
        currency:
          razorpayOrder.currency,
      },
      keyId:
        process.env.RAZORPAY_KEY_ID,
    };
  };

export const verifyDonationPayment =
  async ({
    donationId,
    requesterId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  }) => {
    validateDonationId(
      donationId
    );

    const donation =
      await Donation.findById(
        donationId
      );

    if (!donation) {
      const error = new Error(
        "Donation not found"
      );

      error.statusCode = 404;

      throw error;
    }

    const auditActor =
      requesterId ||
      donation.donor;

    if (
      donation.status ===
      "Paid"
    ) {
      return donation;
    }

    if (
      donation.razorpayOrderId !==
      razorpayOrderId
    ) {
      const error = new Error(
        "Razorpay order does not match the donation"
      );

      error.statusCode = 400;

      throw error;
    }

    if (!razorpaySignature) {
      const error = new Error(
        "Razorpay signature is required"
      );

      error.statusCode = 400;

      throw error;
    }

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env
            .RAZORPAY_KEY_SECRET
        )
        .update(
          `${donation.razorpayOrderId}|${razorpayPaymentId}`
        )
        .digest("hex");

    const expectedBuffer =
      Buffer.from(
        generatedSignature,
        "utf8"
      );

    const receivedBuffer =
      Buffer.from(
        razorpaySignature,
        "utf8"
      );

    const signaturesMatch =
      expectedBuffer.length ===
        receivedBuffer.length &&
      crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      );

    if (!signaturesMatch) {
      donation.status =
        "Failed";

      await donation.save();

      await writeAuditLog({
        actor: auditActor,
        action:
          "DONATION_PAYMENT_FAILED",
        donationId:
          donation._id,
        metadata: {
          incidentId:
            donation.incident,
          razorpayOrderId:
            donation.razorpayOrderId,
          razorpayPaymentId,
          status:
            donation.status,
          reason:
            "Payment signature verification failed",
        },
      });

      const error = new Error(
        "Payment signature verification failed"
      );

      error.statusCode = 400;

      throw error;
    }

    donation.razorpayPaymentId =
      razorpayPaymentId;

    donation.razorpaySignature =
      razorpaySignature;

    donation.status = "Paid";

    donation.paymentVerifiedAt =
      new Date();

    await donation.save();

    await writeAuditLog({
      actor: auditActor,
      action:
        "DONATION_PAYMENT_VERIFIED",
      donationId:
        donation._id,
      metadata: {
        incidentId:
          donation.incident,
        amount:
          donation.amount,
        currency:
          donation.currency,
        razorpayOrderId:
          donation.razorpayOrderId,
        razorpayPaymentId,
        status:
          donation.status,
        paymentVerifiedAt:
          donation.paymentVerifiedAt,
      },
    });

    return donation;
  };

export const getAllDonations =
  async () => {
    const donations =
      await Donation.find()
        .populate(
          "incident",
          "title type normalizedType priority status"
        )
        .populate(
          "donor",
          "name email phone role"
        )
        .sort({
          createdAt: -1,
        });

    return donations;
  };

export const getDonationById =
  async (id) => {
    validateDonationId(id);

    const donation =
      await Donation.findById(id)
        .populate(
          "incident",
          "title type normalizedType priority status"
        )
        .populate(
          "donor",
          "name email phone role"
        );

    if (!donation) {
      const error = new Error(
        "Donation not found"
      );

      error.statusCode = 404;

      throw error;
    }

    return donation;
  };

export const getMyDonations =
  async (userId) => {
    const donations =
      await Donation.find({
        donor: userId,
      })
        .populate(
          "incident",
          "title type normalizedType priority status"
        )
        .sort({
          createdAt: -1,
        });

    return donations;
  };