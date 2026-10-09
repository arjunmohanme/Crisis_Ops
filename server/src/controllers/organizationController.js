import {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  getMyOrganization,
  updateOrganization,
  deleteOrganization,
} from "../services/organizationService.js";

export const createOrganizationController = async (req, res, next) => {
  try {
    const organization = await createOrganization({
      userId: req.user._id,
      role: req.user.role,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      message: "Organization created successfully",
      organization,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrganizationsController = async (
  req,
  res,
  next
) => {
  try {
    const organizations = await getAllOrganizations();

    res.status(200).json({
      success: true,
      count: organizations.length,
      organizations,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizationByIdController = async (
  req,
  res,
  next
) => {
  try {
    const organization = await getOrganizationById(
      req.params.id
    );

    res.status(200).json({
      success: true,
      organization,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyOrganizationController = async (
  req,
  res,
  next
) => {
  try {
    const organization = await getMyOrganization(
      req.user._id
    );

    res.status(200).json({
      success: true,
      organization,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrganizationController = async (
  req,
  res,
  next
) => {
  try {
    const organization = await updateOrganization(
      req.params.id,
      req.user._id,
      req.user.role,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Organization updated successfully",
      organization,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOrganizationController = async (
  req,
  res,
  next
) => {
  try {
    const result = await deleteOrganization(
      req.params.id,
      req.user._id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};