import {
  createResource,
  getAllResources,
  getOrganizationResources,
  getResourceById,
  updateResource,
  deactivateResource,
  deleteResource,
} from "../services/resourceService.js";

export const createResourceController = async (
  req,
  res,
  next
) => {
  try {
    const resource = await createResource({
      organizationId: req.body.organizationId,
      userId: req.user._id,
      role: req.user.role,
      createdBy: req.user._id,
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
      unit: req.body.unit,
      totalQuantity: Number(req.body.totalQuantity),
    });

    res.status(201).json({
      success: true,
      message: "Resource created successfully",
      resource,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllResourcesController = async (
  req,
  res,
  next
) => {
  try {
    const result = await getAllResources(req.query, req.user);

    res.status(200).json({
      success: true,
      count: result.resources.length,
      resources: result.resources,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrganizationResourcesController =
  async (req, res, next) => {
    try {
      const resources =
        await getOrganizationResources({
          organizationId: req.params.organizationId,
          userId: req.user._id,
          role: req.user.role,
        });

      res.status(200).json({
        success: true,
        count: resources.length,
        resources,
      });
    } catch (error) {
      next(error);
    }
  };

export const getResourceByIdController = async (
  req,
  res,
  next
) => {
  try {
    const resource = await getResourceById(req.params.id, req.user);

    res.status(200).json({
      success: true,
      resource,
    });
  } catch (error) {
    next(error);
  }
};

export const updateResourceController = async (
  req,
  res,
  next
) => {
  try {
    const resource = await updateResource({
      id: req.params.id,
      userId: req.user._id,
      role: req.user.role,
      updates: req.body,
    });

    res.status(200).json({
      success: true,
      message: "Resource updated successfully",
      resource,
    });
  } catch (error) {
    next(error);
  }
};

export const deactivateResourceController = async (
  req,
  res,
  next
) => {
  try {
    const resource = await deactivateResource({
      id: req.params.id,
      userId: req.user._id,
      role: req.user.role,
    });

    res.status(200).json({
      success: true,
      message: "Resource deactivated successfully",
      resource,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteResourceController = async (req, res, next) => {
  try {
    const resource = await deleteResource({
      id: req.params.id,
      userId: req.user._id,
      role: req.user.role,
    });

    res.status(200).json({
      success: true,
      message: "Resource deleted successfully",
      resource,
    });
  } catch (error) {
    next(error);
  }
};
