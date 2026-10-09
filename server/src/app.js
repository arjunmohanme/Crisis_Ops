import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import disasterRoutes from "./routes/disasterRoutes.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";
import incidentRoutes from "./routes/incidentRoutes.js";
import incidentVerificationRoutes from "./routes/incidentVerificationRoutes.js";
import organizationRoutes from "./routes/organizationRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import resourceRequestRoutes from "./routes/resourceRequestRoutes.js";
import allocationRoutes from "./routes/allocationRoutes.js";
import volunteerAssignmentRoutes from "./routes/volunteerAssignmentRoutes.js";
import volunteerRoutes from "./routes/volunteerRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";
import auditLogRoutes from "./routes/auditLogRoutes.js";
import userAdminRoutes from "./routes/userAdminRoutes.js";
import incidentAdminRoutes from "./routes/incidentAdminRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CrisisOps API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/disasters", disasterRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/incidents", incidentVerificationRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/resource-requests", resourceRequestRoutes);
app.use("/api/allocations", allocationRoutes);
app.use("/api/volunteer-assignments", volunteerAssignmentRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/users", userAdminRoutes);
app.use("/api/incidents", incidentAdminRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;