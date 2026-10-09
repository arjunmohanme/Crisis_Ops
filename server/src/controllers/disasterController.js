import {
  createDisaster,
  getAllDisasters,
  getDisasterById,
  updateDisaster,
} from "../services/disasterService.js";

export const createDisasterController = async (req, res, next) => {
  try {
    const disaster = await createDisaster({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Disaster created successfully",
      disaster,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllDisastersController = async (req, res, next) => {
  try {
    const disasters = await getAllDisasters();

    res.status(200).json({
      success: true,
      count: disasters.length,
      disasters,
    });
  } catch (error) {
    next(error);
  }
};

export const getDisasterByIdController = async (req, res, next) => {
  try {
    const disaster = await getDisasterById(req.params.id);

    res.status(200).json({
      success: true,
      disaster,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDisasterController = async (req, res, next) => {
  try {
    const disaster = await updateDisaster(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Disaster updated successfully",
      disaster,
    });
  } catch (error) {
    next(error);
  }
};