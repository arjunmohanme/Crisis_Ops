import {
  createAllocation,
  getAllAllocations,
  getMyAllocations,
  getAllocationById,
  fulfillAllocation,
  cancelAllocation,
} from "../services/allocationService.js";

export const createAllocationController = async (
  req,
  res,
  next
) => {
  try {
    const allocation =
      await createAllocation({
        resourceRequestId:
          req.body.resourceRequest,
        allocatedBy:
          req.user._id,
        role:
          req.user.role,
        allocatedQuantity: Number(
          req.body.allocatedQuantity
        ),
        notes:
          req.body.notes,
      });

    return res.status(201).json({
      success: true,
      message:
        "Resource allocated successfully",
      allocation,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAllocationsController =
  async (req, res, next) => {
    try {
      const allocations =
        await getAllAllocations();

      return res.status(200).json({
        success: true,
        count: allocations.length,
        allocations,
      });
    } catch (error) {
      next(error);
    }
  };

export const getMyAllocationsController =
  async (req, res, next) => {
    try {
      const allocations =
        await getMyAllocations(
          req.user._id
        );

      return res.status(200).json({
        success: true,
        count: allocations.length,
        allocations,
      });
    } catch (error) {
      next(error);
    }
  };

export const getAllocationByIdController =
  async (req, res, next) => {
    try {
      const allocation =
        await getAllocationById({
          id: req.params.id,
          userId: req.user._id,
          role: req.user.role,
        });

      return res.status(200).json({
        success: true,
        allocation,
      });
    } catch (error) {
      next(error);
    }
  };

export const fulfillAllocationController =
  async (req, res, next) => {
    try {
      const allocation =
        await fulfillAllocation(
          req.params.id,
          req.user._id
        );

      return res.status(200).json({
        success: true,
        message:
          "Allocation fulfilled successfully",
        allocation,
      });
    } catch (error) {
      next(error);
    }
  };

export const cancelAllocationController =
  async (req, res, next) => {
    try {
      const allocation =
        await cancelAllocation(
          req.params.id,
          req.user._id
        );

      return res.status(200).json({
        success: true,
        message:
          "Allocation cancelled successfully",
        allocation,
      });
    } catch (error) {
      next(error);
    }
  };