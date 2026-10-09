import { useState } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import LoadingScreen from "./components/LoadingScreen";
import ProtectedRoute from "./components/ProtectedRoute";

import AuditLogs from "./pages/AuditLogs";
import Dashboard from "./pages/Dashboard";
import DisasterManagement from "./pages/DisasterManagement";
import Donations from "./pages/Donations";
import ForgotPassword from "./pages/ForgotPassword";
import IncidentDashboard from "./pages/IncidentDashboard";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import MyIncidents from "./pages/MyIncidents";
import NotFound from "./pages/NotFound";
import OrganizationManagement from "./pages/OrganizationManagement";
import Register from "./pages/Register";
import ReportIncident from "./pages/ReportIncident";
import ResetPassword from "./pages/ResetPassword";
import ResourceManagement from "./pages/ResourceManagement";
import ResourceRequests from "./pages/ResourceRequests";
import Allocations from "./pages/Allocations";
import VolunteerManagement from "./pages/VolunteerManagement";
import VolunteerAssignments from "./pages/VolunteerAssignments";
import UserManagement from "./pages/UserManagement";
import Profile from "./pages/Profile";
import Unauthorized from "./pages/Unauthorized";

function App() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      {loading && (
        <LoadingScreen
          onComplete={() => setLoading(false)}
        />
      )}

      <div
        className={`transition-opacity duration-700 ${
          loading
            ? "opacity-0"
            : "opacity-100"
        }`}
      >
        <BrowserRouter>
          <Routes>
            {/* Public */}

            <Route
              path="/"
              element={<LandingPage />}
            />

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/register"
              element={<Register />}
            />

            <Route
              path="/forgot-password"
              element={<ForgotPassword />}
            />

            <Route
              path="/reset-password/:token"
              element={<ResetPassword />}
            />

            {/* Dashboard */}

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Incident Operations */}

            <Route
              path="/incidents"
              element={
                <ProtectedRoute
                  roles={[
                    "Citizen",
                    "Admin",
                    "Volunteer",
                    "Organization",
                  ]}
                >
                  <IncidentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Citizen */}

            <Route
              path="/report-incident"
              element={
                <ProtectedRoute
                  roles={[
                    "Citizen",
                    "Volunteer",
                    "Organization",
                    "Admin",
                  ]}
                >
                  <ReportIncident />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-incidents"
              element={
                <ProtectedRoute
                  roles={[
                    "Citizen",
                    "Volunteer",
                    "Organization",
                    "Admin",
                  ]}
                >
                  <MyIncidents />
                </ProtectedRoute>
              }
            />

            {/* Disaster Management */}

            <Route
              path="/disasters"
              element={
                <ProtectedRoute
                  roles={["Admin"]}
                >
                  <DisasterManagement />
                </ProtectedRoute>
              }
            />

            {/* Organization Management */}

            <Route
              path="/organization"
              element={
                <ProtectedRoute
                  roles={["Organization"]}
                >
                  <OrganizationManagement />
                </ProtectedRoute>
              }
            />

            {/* Resources */}

            <Route
              path="/resources"
              element={
                <ProtectedRoute
                  roles={[
                    "Admin",
                    "Organization",
                    "Volunteer",
                  ]}
                >
                  <ResourceManagement />
                </ProtectedRoute>
              }
            />

            {/* Resource Requests */}

            <Route
              path="/resource-requests"
              element={
                <ProtectedRoute
                  roles={[
                    "Admin",
                    "Organization",
                    "Volunteer",
                  ]}
                >
                  <ResourceRequests />
                </ProtectedRoute>
              }
            />

            {/* Allocations */}

            <Route
              path="/allocations"
              element={
                <ProtectedRoute
                  roles={[
                    "Admin",
                    "Organization",
                  ]}
                >
                  <Allocations />
                </ProtectedRoute>
              }
            />

            {/* Volunteer Management */}

            <Route
              path="/volunteers"
              element={
                <ProtectedRoute
                  roles={[
                    "Admin",
                    "Volunteer",
                  ]}
                >
                  <VolunteerManagement />
                </ProtectedRoute>
              }
            />

            {/* Volunteer Assignments */}

            <Route
              path="/volunteer-assignments"
              element={
                <ProtectedRoute
                  roles={[
                    "Admin",
                    "Volunteer",
                  ]}
                >
                  <VolunteerAssignments />
                </ProtectedRoute>
              }
            />

            {/* Admin User Management */}

            <Route
              path="/user-management"
              element={
                <ProtectedRoute
                  roles={["Admin"]}
                >
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            {/* Profile */}

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Donations */}

            <Route
              path="/donations"
              element={
                <ProtectedRoute>
                  <Donations />
                </ProtectedRoute>
              }
            />

            {/* Audit Logs */}

            <Route
              path="/audit-logs"
              element={
                <ProtectedRoute
                  roles={["Admin"]}
                >
                  <AuditLogs />
                </ProtectedRoute>
              }
            />

            {/* Unauthorized */}

            <Route
              path="/unauthorized"
              element={<Unauthorized />}
            />

            {/* 404 */}

            <Route
              path="*"
              element={<NotFound />}
            />
          </Routes>
        </BrowserRouter>
      </div>
    </>
  );
}

export default App;