import {
  createResourceRequest,
  getAllResourceRequests,
  getResourceRequestById,
  getMyResourceRequests,
  updateResourceRequestFulfillment,
  reviewResourceRequest,
  cancelResourceRequest,
} from "../services/resourceRequestService.js";

export const createResourceRequestController = async (
  req,
  res,
  next
) => {
  try {
    const resourceRequest =
      await createResourceRequest({
        incidentId: req.body.incident,
        resourceId: req.body.resource,
        requestedBy: req.user._id,
        role: req.user.role,
        requestedQuantity: Number(
          req.body.requestedQuantity
        ),
        reason: req.body.reason,
      });

    res.status(201).json({
      success: true,
      message:
        "Resource request created successfully",
      resourceRequest,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllResourceRequestsController =
  async (req, res, next) => {
    try {
      const requests =
        await getAllResourceRequests({
        userId: req.user._id,
        role: req.user.role,
      });

      res.status(200).json({
        success: true,
        count: requests.length,
        resourceRequests: requests,
      });
    } catch (error) {
      next(error);
    }
  };

export const getResourceRequestByIdController =
  async (req, res, next) => {
    try {
      const resourceRequest =
        await getResourceRequestById({
          id: req.params.id,
          userId: req.user._id,
          role: req.user.role,
        });

      res.status(200).json({
        success: true,
        resourceRequest,
      });
    } catch (error) {
      next(error);
    }
  };

export const getMyResourceRequestsController =
  async (req, res, next) => {
    try {
      const requests =
        await getMyResourceRequests(
          req.user._id
        );

      res.status(200).json({
        success: true,
        count: requests.length,
        resourceRequests: requests,
      });
    } catch (error) {
      next(error);
    }
  };

export const reviewResourceRequestController =
  async (req, res, next) => {
    try {
      const resourceRequest =
        await reviewResourceRequest({
          id: req.params.id,
          adminId: req.user._id,
          status: req.body.status,
          rejectionReason:
            req.body.rejectionReason,
        });

      res.status(200).json({
        success: true,
        message: `Resource request ${req.body.status.toLowerCase()} successfully`,
        resourceRequest,
      });
    } catch (error) {
      next(error);
    }
  };

export const cancelResourceRequestController =
  async (req, res, next) => {
    try {
      const resourceRequest =
        await cancelResourceRequest({
          id: req.params.id,
          userId: req.user._id,
        });

      res.status(200).json({
        success: true,
        message:
          "Resource request cancelled successfully",
        resourceRequest,
      });
    } catch (error) {
      next(error);
    }
  };

export const updateResourceRequestFulfillmentController = async (req, res, next) => {
  try {
    const resourceRequest = await updateResourceRequestFulfillment({
      id: req.params.id,
      userId: req.user._id,
      role: req.user.role,
    });

    res.status(200).json({
      success: true,
      message: "Resource request fulfillment state updated",
      resourceRequest,
    });
  } catch (error) {
    next(error);
  }
};
