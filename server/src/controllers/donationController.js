import {
  createDonationOrder,
  verifyDonationPayment,
  getAllDonations,
  getDonationById,
  getMyDonations,
  getDonationEligibleIncidents,
} from "../services/donationService.js";

export const createDonationOrderController = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await createDonationOrder({
        incidentId: req.body.incident,
        donorId: req.user?._id || null,
        donorName: req.body.donorName,
        donorEmail: req.body.donorEmail,
        amount: req.body.amount,
        notes: req.body.notes,
      });

    return res.status(201).json({
      success: true,
      message:
        "Donation order created successfully",
      donation: result.donation,
      order: result.order,
      keyId: result.keyId,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyDonationPaymentController =
  async (req, res, next) => {
    try {
      const donation =
        await verifyDonationPayment({
          donationId: req.params.id || req.body.donationId,
          requesterId: req.user._id,
          razorpayOrderId:
            req.body.razorpayOrderId,
          razorpayPaymentId:
            req.body.razorpayPaymentId,
          razorpaySignature:
            req.body.razorpaySignature,
        });

      return res.status(200).json({
        success: true,
        message:
          "Donation payment verified successfully",
        donation,
      });
    } catch (error) {
      next(error);
    }
  };

export const getDonationEligibleIncidentsController =
  async (req, res, next) => {
    try {
      const incidents =
        await getDonationEligibleIncidents();

      return res.status(200).json({
        success: true,
        count: incidents.length,
        incidents,
      });
    } catch (error) {
      next(error);
    }
  };

export const getAllDonationsController = async (
  req,
  res,
  next
) => {
  try {
    const donations =
      await getAllDonations();

    return res.status(200).json({
      success: true,
      count: donations.length,
      donations,
    });
  } catch (error) {
    next(error);
  }
};

export const getDonationByIdController = async (
  req,
  res,
  next
) => {
  try {
    const donation =
      await getDonationById(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      donation,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyDonationsController =
  async (req, res, next) => {
    try {
      const donations =
        await getMyDonations(
          req.user._id
        );

      return res.status(200).json({
        success: true,
        count: donations.length,
        donations,
      });
    } catch (error) {
      next(error);
    }
  };

export const getDonationHistoryController = async (req, res, next) => {
  try {
    const donations =
      req.user.role === "Admin"
        ? await getAllDonations()
        : await getMyDonations(req.user._id);

    return res.status(200).json({
      success: true,
      count: donations.length,
      donations,
    });
  } catch (error) {
    next(error);
  }
};
