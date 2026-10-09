import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import mongoose from "mongoose";

import User from "../models/User.js";

const allowedRoles = [
  "Citizen",
  "Volunteer",
  "Organization",
];

const getPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  requestedRole: user.requestedRole,
  accountStatus: user.accountStatus,
  phone: user.phone,
  isActive: user.isActive,
  isBlocked: user.isBlocked,
  skills: user.skills,
  availability: user.availability,
  location: user.location,
  isFieldVerifier: user.isFieldVerifier,
  organization: user.organization,
});

/*
 * Create Gmail SMTP transporter.
 */
const createTransporter = () => {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
  } = process.env;

  if (
    !SMTP_HOST ||
    !SMTP_PORT ||
    !SMTP_USER ||
    !SMTP_PASS
  ) {
    const error = new Error(
      "Password reset email service is not configured"
    );

    error.statusCode = 500;

    throw error;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,

    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

/*
 * Send password reset email.
 */
const sendPasswordResetEmail = async ({
  email,
  name,
  resetUrl,
}) => {
  const transporter = createTransporter();

  const from =
    process.env.SMTP_FROM ||
    process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to: email,

    subject:
      "Reset your CrisisOps password",

    text: `Hello ${name},

A password reset was requested for your CrisisOps account.

Reset your password using this link:

${resetUrl}

This password reset link expires in 15 minutes.

If you did not request a password reset, you can safely ignore this email.

CrisisOps
Emergency Response Coordination`,
    
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>CrisisOps Password Reset</title>
        </head>

        <body
          style="
            margin:0;
            padding:0;
            background:#f5f7fa;
            font-family:Arial,Helvetica,sans-serif;
            color:#0f172a;
          "
        >
          <div
            style="
              max-width:600px;
              margin:0 auto;
              padding:40px 20px;
            "
          >
            <div
              style="
                background:#ffffff;
                border:1px solid #e2e8f0;
                border-radius:20px;
                padding:35px;
              "
            >
              <div
                style="
                  font-size:20px;
                  font-weight:800;
                  letter-spacing:3px;
                  color:#0f172a;
                "
              >
                CRISISOPS
              </div>

              <div
                style="
                  margin-top:6px;
                  font-size:11px;
                  color:#64748b;
                  text-transform:uppercase;
                  letter-spacing:2px;
                "
              >
                Emergency Response Coordination
              </div>

              <h1
                style="
                  margin-top:35px;
                  margin-bottom:12px;
                  font-size:28px;
                  color:#0f172a;
                "
              >
                Reset your password
              </h1>

              <p
                style="
                  font-size:15px;
                  line-height:1.7;
                  color:#475569;
                "
              >
                Hello ${name},
              </p>

              <p
                style="
                  font-size:15px;
                  line-height:1.7;
                  color:#475569;
                "
              >
                We received a request to reset the password
                for your CrisisOps account.
              </p>

              <div style="margin:30px 0;">
                <a
                  href="${resetUrl}"
                  style="
                    display:inline-block;
                    padding:14px 22px;
                    background:#0f172a;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:10px;
                    font-size:14px;
                    font-weight:700;
                  "
                >
                  Reset Password
                </a>
              </div>

              <p
                style="
                  font-size:13px;
                  line-height:1.7;
                  color:#64748b;
                "
              >
                This link expires in
                <strong>15 minutes</strong>
                and can only be used once.
              </p>

              <p
                style="
                  margin-top:25px;
                  font-size:13px;
                  line-height:1.7;
                  color:#64748b;
                "
              >
                If you did not request this password reset,
                you can safely ignore this email.
              </p>

              <div
                style="
                  margin-top:30px;
                  padding-top:20px;
                  border-top:1px solid #e2e8f0;
                  font-size:11px;
                  color:#94a3b8;
                "
              >
                CrisisOps · Emergency Response Coordination
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  });
};

/*
 * Register user.
 */
export const registerUser = async ({
  name,
  email,
  password,
  role = "Citizen",
  phone,
}) => {
  const existingUser = await User.findOne({
    email,
  });

  if (existingUser) {
    const error = new Error(
      "An account with this email already exists"
    );

    error.statusCode = 409;

    throw error;
  }

  if (!allowedRoles.includes(role)) {
    const error = new Error(
      "Invalid registration role"
    );

    error.statusCode = 400;

    throw error;
  }

  const hashedPassword =
    await bcrypt.hash(password, 12);

  const requiresApproval =
    role === "Volunteer" ||
    role === "Organization";

  const user = await User.create({
    name,
    email,
    password: hashedPassword,

    role: "Citizen",

    requestedRole: requiresApproval
      ? role
      : null,

    accountStatus: requiresApproval
      ? "Pending"
      : "Approved",

    phone,

    isActive: true,
    isBlocked: false,
  });

  return {
    user: getPublicUser(user),
    requiresApproval,
  };
};

/*
 * Login user.
 */
export const loginUser = async ({
  email,
  password,
}) => {
  const user = await User.findOne({
    email,
  }).select("+password");

  if (!user) {
    const error = new Error(
      "Invalid email or password"
    );

    error.statusCode = 401;

    throw error;
  }

  if (user.isBlocked || !user.isActive) {
    const error = new Error(
      "Your account is currently unavailable"
    );

    error.statusCode = 403;

    throw error;
  }

  const accountStatus =
    user.accountStatus || "Approved";

  if (
    user.requestedRole &&
    accountStatus === "Pending"
  ) {
    const error = new Error(
      "Your role application is awaiting administrator approval"
    );

    error.statusCode = 403;

    throw error;
  }

  if (
    user.requestedRole &&
    accountStatus === "Rejected"
  ) {
    const error = new Error(
      user.rejectionReason ||
        "Your role application was rejected"
    );

    error.statusCode = 403;

    throw error;
  }

  const passwordMatch =
    await bcrypt.compare(
      password,
      user.password
    );

  if (!passwordMatch) {
    const error = new Error(
      "Invalid email or password"
    );

    error.statusCode = 401;

    throw error;
  }

  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || "1d",
    }
  );

  return {
    token,
    user: getPublicUser(user),
  };
};

/*
 * Request password reset.
 */
export const requestPasswordReset = async (
  email
) => {
  const user = await User.findOne({
    email,
  });

  /*
   * Do not reveal whether the email
   * exists in the system.
   */
  if (!user) {
    return;
  }

  /*
   * Generate cryptographically secure token.
   */
  const rawToken =
    crypto.randomBytes(32).toString("hex");

  /*
   * Store only the SHA-256 hash.
   */
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  user.resetPasswordToken =
    hashedToken;

  user.resetPasswordExpire =
    new Date(
      Date.now() + 15 * 60 * 1000
    );

  await user.save({
    validateBeforeSave: false,
  });

  const clientUrl = (
    process.env.CLIENT_URL ||
    "http://localhost:5173"
  ).replace(/\/$/, "");

  const resetUrl =
    `${clientUrl}/reset-password/${rawToken}`;

  try {
    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl,
    });
  } catch (error) {
    /*
     * Remove token if the email could
     * not be delivered.
     */
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save({
      validateBeforeSave: false,
    });

    throw error;
  }
};

/*
 * Reset password using secure token.
 */
export const resetPassword = async ({
  token,
  newPassword,
}) => {
  if (!token) {
    const error = new Error(
      "Password reset token is required"
    );

    error.statusCode = 400;

    throw error;
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,

    resetPasswordExpire: {
      $gt: new Date(),
    },
  }).select(
    "+password +resetPasswordToken +resetPasswordExpire"
  );

  if (!user) {
    const error = new Error(
      "Password reset link is invalid or has expired"
    );

    error.statusCode = 400;

    throw error;
  }

  user.password =
    await bcrypt.hash(
      newPassword,
      12
    );

  /*
   * Make the reset link single-use.
   */
  user.resetPasswordToken = null;
  user.resetPasswordExpire = null;

  await user.save();

  return {
    message:
      "Password reset successfully",
  };
};

export const updateOwnProfile = async ({
  userId,
  name,
  phone,
  skills,
  availability,
  location,
}) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error("Invalid user ID");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (name !== undefined) user.name = name.trim();
  if (phone !== undefined) user.phone = phone?.trim() || null;
  if (skills !== undefined) {
    user.skills = Array.isArray(skills)
      ? skills.map((item) => String(item).trim()).filter(Boolean)
      : [];
  }
  if (availability !== undefined && user.role === "Volunteer") {
    user.availability = availability;
  }

  if (location !== undefined && user.role === "Volunteer") {
    user.location = {
      address: location?.address?.trim() || null,
      latitude:
        location?.latitude === null || location?.latitude === undefined || location?.latitude === ""
          ? null
          : Number(location.latitude),
      longitude:
        location?.longitude === null || location?.longitude === undefined || location?.longitude === ""
          ? null
          : Number(location.longitude),
    };
  }

  await user.save();
  return getPublicUser(user);
};
