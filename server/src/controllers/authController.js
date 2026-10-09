import {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
  updateOwnProfile,
} from "../services/authService.js";

export const register = async (
  req,
  res,
  next
) => {
  try {
    const result = await registerUser(
      req.body
    );

    res.status(201).json({
      success: true,
      message: result.requiresApproval
        ? "Registration submitted. Administrator approval is required."
        : "Account created successfully.",
      user: result.user,
      requiresApproval:
        result.requiresApproval,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req,
  res,
  next
) => {
  try {
    const result = await loginUser(
      req.body
    );

    res.status(200).json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req,
  res,
  next
) => {
  try {
    await requestPasswordReset(
      req.body.email
    );

    res.status(200).json({
      success: true,
      message:
        "If an account exists for this email, a password reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPasswordController = async (
  req,
  res,
  next
) => {
  try {
    const result = await resetPassword({
      token: req.params.token,
      newPassword: req.body.newPassword,
    });

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await updateOwnProfile({
      userId: req.user._id,
      name: req.body.name,
      phone: req.body.phone,
      skills: req.body.skills,
      availability: req.body.availability,
      location: req.body.location,
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};
