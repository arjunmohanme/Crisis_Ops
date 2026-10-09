import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const getStoredUser = () => {
  try {
    return JSON.parse(
      localStorage.getItem(
        "crisisops_user"
      ) || "null"
    );
  } catch {
    return null;
  }
};

const getToken = () =>
  localStorage.getItem(
    "crisisops_token"
  );

const roleDescription = {
  Admin:
    "Manage incidents, users, resources, disasters, donations, audit logs and emergency response operations.",

  Citizen:
    "Report emergency incidents, track your reports and support verified emergency operations.",

  Volunteer:
    "Review incidents, manage your volunteer profile, handle assignments and support emergency operations.",

  Organization:
    "Manage your organization profile, resources, requests, allocations and support emergency operations.",
};

const cards = [
  {
    key: "incidents",
    title: "Incident Operations",
    section: "Core Module",
    description:
      "Search, filter, monitor and manage emergency incidents through the operational lifecycle.",
    action: "Open incident operations",
    path: "/incidents",
    roles: [
      "Admin",
      "Volunteer",
      "Organization",
    ],
    number: "01",
    color: "cyan",
  },
  {
    key: "resources",
    title: "Resources",
    section: "Response",
    description:
      "Manage emergency inventory, resource availability and organizational stock.",
    action: "Open resources",
    path: "/resources",
    roles: [
      "Admin",
      "Organization",
      "Volunteer",
    ],
    number: "02",
    color: "emerald",
  },
  {
    key: "requests",
    title: "Resource Requests",
    section: "Allocation",
    description:
      "Request, review and track resources required for active emergency incidents.",
    action: "Open resource requests",
    path: "/resource-requests",
    roles: [
      "Admin",
      "Organization",
      "Volunteer",
    ],
    number: "03",
    color: "amber",
  },
  {
    key: "allocations",
    title: "Allocations",
    section: "Fulfillment",
    description:
      "Allocate approved resources and track their fulfillment status.",
    action: "Open allocations",
    path: "/allocations",
    roles: [
      "Admin",
      "Organization",
    ],
    number: "04",
    color: "blue",
  },
  {
    key: "organization",
    title: "Organization Profile",
    section: "Organization",
    description:
      "Maintain your organization profile, contact details and coordination information.",
    action: "Open organization profile",
    path: "/organization",
    roles: ["Organization"],
    number: "05",
    color: "violet",
  },
  {
    key: "disasters",
    title: "Disaster Management",
    section: "Administration",
    description:
      "Create, monitor, update and close disaster events and affected locations.",
    action: "Open disaster management",
    path: "/disasters",
    roles: ["Admin"],
    number: "05",
    color: "red",
  },
  {
    key: "volunteers",
    title: "Volunteer Management",
    section: "Response Team",
    description:
      "Manage volunteer profiles, availability, skills and field-verifier capability.",
    action: "Open volunteer management",
    path: "/volunteers",
    roles: [
      "Admin",
      "Volunteer",
    ],
    number: "06",
    color: "violet",
  },
  {
    key: "volunteer-assignments",
    title: "Volunteer Assignments",
    section: "Response Team",
    description:
      "Assign volunteers to verified incidents and track assignment progress.",
    action: "Open volunteer assignments",
    path: "/volunteer-assignments",
    roles: [
      "Admin",
      "Volunteer",
    ],
    number: "07",
    color: "orange",
  },
  {
    key: "users",
    title: "User Management",
    section: "Administration",
    description:
      "Review and approve pending Volunteer and Organization registration applications.",
    action: "Open user management",
    path: "/user-management",
    roles: ["Admin"],
    number: "08",
    color: "purple",
  },
  {
    key: "donations",
    title: "Donations",
    section: "Emergency Support",
    description:
      "Support verified and active incidents through Razorpay and view donation history.",
    action: "Open donations",
    path: "/donations",
    roles: [
      "Admin",
      "Citizen",
      "Volunteer",
      "Organization",
    ],
    number: "09",
    color: "pink",
  },
  {
    key: "audit-logs",
    title: "Audit Logs",
    section: "Administration",
    description:
      "Review sensitive operational actions recorded across the CrisisOps platform.",
    action: "Open audit logs",
    path: "/audit-logs",
    roles: ["Admin"],
    number: "10",
    color: "slate",
  },
  {
    key: "report",
    title: "Report Incident",
    section: "Citizen Action",
    description:
      "Report an emergency situation with location and affected population details.",
    action: "Create incident report",
    path: "/report-incident",
    roles: ["Citizen"],
    number: "01",
    color: "cyan",
  },
  {
    key: "my-incidents",
    title: "My Incidents",
    section: "Citizen Portal",
    description:
      "Track the emergency reports you have submitted and their current status.",
    action: "View my incidents",
    path: "/my-incidents",
    roles: ["Citizen"],
    number: "02",
    color: "blue",
  },
];

const colorClasses = {
  cyan: {
    icon:
      "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300",
    hover:
      "hover:border-cyan-300 dark:hover:border-cyan-800",
    text:
      "text-cyan-600 dark:text-cyan-400",
  },

  emerald: {
    icon:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    hover:
      "hover:border-emerald-300 dark:hover:border-emerald-800",
    text:
      "text-emerald-600 dark:text-emerald-400",
  },

  amber: {
    icon:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    hover:
      "hover:border-amber-300 dark:hover:border-amber-800",
    text:
      "text-amber-600 dark:text-amber-400",
  },

  red: {
    icon:
      "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    hover:
      "hover:border-red-300 dark:hover:border-red-800",
    text:
      "text-red-600 dark:text-red-400",
  },

  blue: {
    icon:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    hover:
      "hover:border-blue-300 dark:hover:border-blue-800",
    text:
      "text-blue-600 dark:text-blue-400",
  },

  violet: {
    icon:
      "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    hover:
      "hover:border-violet-300 dark:hover:border-violet-800",
    text:
      "text-violet-600 dark:text-violet-400",
  },

  orange: {
    icon:
      "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    hover:
      "hover:border-orange-300 dark:hover:border-orange-800",
    text:
      "text-orange-600 dark:text-orange-400",
  },

  purple: {
    icon:
      "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
    hover:
      "hover:border-purple-300 dark:hover:border-purple-800",
    text:
      "text-purple-600 dark:text-purple-400",
  },

  pink: {
    icon:
      "bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300",
    hover:
      "hover:border-pink-300 dark:hover:border-pink-800",
    text:
      "text-pink-600 dark:text-pink-400",
  },

  slate: {
    icon:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    hover:
      "hover:border-slate-400 dark:hover:border-slate-600",
    text:
      "text-slate-600 dark:text-slate-400",
  },
};

const formatAmount = (value) => {
  const amount = Number(value || 0);

  return `₹${amount.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  )}`;
};

const getKpis = (role, data) => {
  if (!data) {
    return [];
  }

  if (role === "Admin") {
    return [
      {
        label: "Total Incidents",
        value:
          data.incidents?.total ?? 0,
        detail: `${data.incidents?.active ?? 0} active`,
      },
      {
        label: "Pending Verification",
        value:
          data.incidents
            ?.pendingVerification ?? 0,
        detail: "Requires review",
      },
      {
        label: "Pending Applications",
        value:
          data.applications
            ?.pending ?? 0,
        detail: "Volunteer / Organization",
      },
      {
        label: "Paid Donations",
        value: formatAmount(
          data.donations?.paidAmount
        ),
        detail: `${
          data.donations?.total ?? 0
        } total records`,
      },
    ];
  }

  if (role === "Organization") {
    return [
      {
        label: "Resources",
        value:
          data.resources?.total ?? 0,
        detail:
          data.organization?.name ||
          "Organization",
      },
      {
        label: "Pending Requests",
        value:
          data.resourceRequests
            ?.pending ?? 0,
        detail: "Awaiting review",
      },
      {
        label: "Approved Requests",
        value:
          data.resourceRequests
            ?.approved ?? 0,
        detail: "Approved",
      },
      {
        label: "Active Allocations",
        value:
          data.allocations?.active ??
          0,
        detail: "Allocated / fulfilled",
      },
    ];
  }

  if (role === "Volunteer") {
    return [
      {
        label: "Total Assignments",
        value:
          data.assignments?.total ?? 0,
        detail: "All assignments",
      },
      {
        label: "Active Assignments",
        value:
          data.assignments?.active ?? 0,
        detail: "Current workload",
      },
      {
        label: "Completed",
        value:
          data.assignments?.completed ??
          0,
        detail: "Completed assignments",
      },
      {
        label: "Availability",
        value:
          data.profile?.availability ||
          "Unavailable",
        detail: data.profile
          ?.isFieldVerifier
          ? "Field verifier enabled"
          : "Standard volunteer",
      },
    ];
  }

  return [
    {
      label: "My Incidents",
      value:
        data.incidents?.total ?? 0,
      detail: `${
        data.incidents?.active ?? 0
      } active`,
    },
    {
      label: "Resolved Incidents",
      value:
        data.incidents?.resolved ?? 0,
      detail: "Successfully resolved",
    },
    {
      label: "Donations",
      value:
        data.donations?.total ?? 0,
      detail: "Donation records",
    },
    {
      label: "Donated Amount",
      value: formatAmount(
        data.donations?.paidAmount
      ),
      detail: "Verified payments",
    },
  ];
};

function Dashboard() {
  const navigate = useNavigate();

  const user = useMemo(
    () => getStoredUser(),
    []
  );

  const role =
    user?.role || "Citizen";

  const token = useMemo(
    () => getToken(),
    []
  );

  const [dashboardData, setDashboardData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const fetchDashboard =
    useCallback(async () => {
      if (!token) {
        setLoading(false);
        setError(
          "Authentication required."
        );
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/api/dashboard`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load dashboard data."
          );
        }

        setDashboardData(
          data.data || null
        );
      } catch (requestError) {
        setError(
          requestError.message ||
            "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    }, [token]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const visibleCards = cards.filter(
    (card) =>
      card.roles.includes(role)
  );

  const kpis = getKpis(
    role,
    dashboardData
  );

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-950 transition-colors duration-300 dark:bg-[#050914] dark:text-white">
      <Navbar />

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                CRISISOPS
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Operations Dashboard
              </h1>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Welcome,{" "}
                {user?.name || "User"}.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Account
              </p>

              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white dark:bg-white dark:text-slate-950">
                  {role.charAt(0)}
                </div>

                <div>
                  <p className="text-sm font-bold">
                    {user?.name || "User"}
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {role}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Current Role
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  {role}
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                  {roleDescription[
                    role
                  ] ||
                    "Access your CrisisOps workspace."}
                </p>
              </div>

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white dark:bg-white dark:text-slate-950">
                {role.charAt(0)}
              </div>
            </div>
          </section>

          <section className="mt-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Operational Overview
              </p>

              <h2 className="mt-2 text-xl font-black">
                Key Performance Indicators
              </h2>
            </div>

            <button
              type="button"
              onClick={fetchDashboard}
              disabled={loading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {loading
                ? "Loading..."
                : "Refresh"}
            </button>
          </section>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  {kpi.label}
                </p>

                <p className="mt-3 text-3xl font-black">
                  {loading
                    ? "—"
                    : kpi.value}
                </p>

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {kpi.detail}
                </p>
              </div>
            ))}
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-3">
            {visibleCards.map((card) => {
              const colors =
                colorClasses[
                  card.color
                ];

              return (
                <button
                  key={card.key}
                  type="button"
                  onClick={() =>
                    navigate(
                      card.path
                    )
                  }
                  className={`group rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 ${colors.hover}`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-black ${colors.icon}`}
                    >
                      {card.number}
                    </div>

                    <span className="text-xl text-slate-400 transition-transform duration-300 group-hover:translate-x-1">
                      ↗
                    </span>
                  </div>

                  <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    {card.section}
                  </p>

                  <h3 className="mt-2 text-xl font-black">
                    {card.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                    {card.description}
                  </p>

                  <div
                    className={`mt-6 flex items-center gap-2 text-xs font-bold ${colors.text}`}
                  >
                    {card.action}
                    <span>→</span>
                  </div>
                </button>
              );
            })}
          </section>

          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Current Access
            </p>

            <h3 className="mt-2 text-xl font-black">
              Role-based CrisisOps workspace
            </h3>

            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-400">
              Available modules and KPI data are
              displayed according to your account
              permissions.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;