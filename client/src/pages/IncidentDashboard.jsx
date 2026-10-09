import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import PageShell from "../components/PageShell";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const statusOptions = [
  "All",
  "Reported",
  "Under Review",
  "Verified",
  "Active",
  "Resolved",
  "Archived",
  "Rejected",
];

const priorityOptions = [
  "All",
  "Low",
  "Medium",
  "High",
  "Critical",
];

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

const getStatusClasses = (status) => {
  const classes = {
    Reported:
      "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",

    "Under Review":
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",

    Verified:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",

    Active:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",

    Resolved:
      "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",

    Archived:
      "border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500",

    Rejected:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
  };

  return (
    classes[status] ||
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
  );
};

const getPriorityClasses = (
  priority
) => {
  const classes = {
    Low:
      "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",

    Medium:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",

    High:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",

    Critical:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
  };

  return (
    classes[priority] ||
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
  );
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getVerificationClasses = (
  action
) => {
  if (action === "Verified") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  if (action === "Rejected") {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300";
  }

  return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
};

function IncidentDashboard() {
  const storedUser = useMemo(
    () => getStoredUser(),
    []
  );

  const token = localStorage.getItem(
    "crisisops_token"
  );

  const [user, setUser] =
    useState(storedUser);

  const [incidents, setIncidents] =
    useState([]);

  const [pagination, setPagination] =
    useState({
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

  const [status, setStatus] =
    useState("All");

  const [priority, setPriority] =
    useState("All");

  const [type, setType] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState("");

  const [error, setError] =
    useState("");

  const [
    selectedIncident,
    setSelectedIncident,
  ] = useState(null);

  const [
    verificationAction,
    setVerificationAction,
  ] = useState("Verified");

  const [
    verificationNotes,
    setVerificationNotes,
  ] = useState("");

  const [
    verificationLoading,
    setVerificationLoading,
  ] = useState(false);

  const [
    historyIncident,
    setHistoryIncident,
  ] = useState(null);

  const [
    verificationHistory,
    setVerificationHistory,
  ] = useState([]);

  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);

  const [
    historyError,
    setHistoryError,
  ] = useState("");

  const fetchUser =
    useCallback(async () => {
      if (!token) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API_URL}/api/auth/me`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (
          response.ok &&
          data.user
        ) {
          setUser(data.user);

          localStorage.setItem(
            "crisisops_user",
            JSON.stringify(
              data.user
            )
          );
        }
      } catch {
        // Stored user data remains available.
      }
    }, [token]);

  const fetchIncidents =
    useCallback(
      async (page = 1) => {
        if (!token) {
          setError(
            "Authentication required."
          );
          setLoading(false);
          return;
        }

        setLoading(true);
        setError("");

        try {
          const params =
            new URLSearchParams();

          if (status !== "All") {
            params.append(
              "status",
              status
            );
          }

          if (
            priority !== "All"
          ) {
            params.append(
              "priority",
              priority
            );
          }

          if (type.trim()) {
            params.append(
              "type",
              type.trim()
            );
          }

          if (location.trim()) {
            params.append(
              "location",
              location.trim()
            );
          }

          if (search.trim()) {
            params.append(
              "search",
              search.trim()
            );
          }

          params.append(
            "page",
            page
          );

          params.append(
            "limit",
            10
          );

          const response =
            await fetch(
              `${API_URL}/api/incidents?${params.toString()}`,
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
                "Failed to load incidents."
            );
          }

          setIncidents(
            data.incidents || []
          );

          setPagination(
            data.pagination || {
              total: 0,
              page: 1,
              limit: 10,
              totalPages: 1,
            }
          );
        } catch (
          requestError
        ) {
          setError(
            requestError.message ||
              "Unable to load incidents."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        token,
        status,
        priority,
        type,
        location,
        search,
      ]
    );

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    fetchIncidents(1);
  }, [fetchIncidents]);

  const handleSearch = (
    event
  ) => {
    event.preventDefault();
    fetchIncidents(1);
  };

  const resetFilters = () => {
    setStatus("All");
    setPriority("All");
    setType("");
    setLocation("");
    setSearch("");
  };

  const updateIncident = async (
    incidentId,
    updates
  ) => {
    const actionKey =
      `${incidentId}-${JSON.stringify(
        updates
      )}`;

    setActionLoading(actionKey);
    setError("");

    try {
      const response =
        await fetch(
          `${API_URL}/api/incidents/${incidentId}/operational`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify(
              updates
            ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update incident."
        );
      }

      await fetchIncidents(
        pagination.page
      );
    } catch (
      requestError
    ) {
      setError(
        requestError.message ||
          "Unable to update incident."
      );
    } finally {
      setActionLoading("");
    }
  };

  const openVerification = (
    incident,
    action
  ) => {
    setSelectedIncident(incident);
    setVerificationAction(action);
    setVerificationNotes("");
    setError("");
  };

  const closeVerification = () => {
    if (verificationLoading) {
      return;
    }

    setSelectedIncident(null);
    setVerificationAction(
      "Verified"
    );
    setVerificationNotes("");
  };

  const submitVerification =
    async (event) => {
      event.preventDefault();

      if (!selectedIncident) {
        return;
      }

      if (
        verificationAction ===
          "Rejected" &&
        !verificationNotes.trim()
      ) {
        setError(
          "A rejection reason is required."
        );
        return;
      }

      setVerificationLoading(true);
      setError("");

      try {
        const response =
          await fetch(
            `${API_URL}/api/incidents/${selectedIncident._id}/verify`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${token}`,
              },
              body: JSON.stringify({
                action:
                  verificationAction,
                notes:
                  verificationNotes.trim(),
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to complete verification."
          );
        }

        closeVerification();

        await fetchIncidents(
          pagination.page
        );
      } catch (
        requestError
      ) {
        setError(
          requestError.message ||
            "Unable to complete verification."
        );
      } finally {
        setVerificationLoading(
          false
        );
      }
    };

  const openVerificationHistory =
    async (incident) => {
      setHistoryIncident(incident);
      setVerificationHistory([]);
      setHistoryError("");
      setHistoryLoading(true);

      try {
        const response =
          await fetch(
            `${API_URL}/api/incidents/${incident._id}/verifications`,
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
              "Unable to load verification history."
          );
        }

        setVerificationHistory(
          data.verifications || []
        );
      } catch (
        requestError
      ) {
        setHistoryError(
          requestError.message ||
            "Unable to load verification history."
        );
      } finally {
        setHistoryLoading(false);
      }
    };

  const closeVerificationHistory =
    () => {
      if (historyLoading) {
        return;
      }

      setHistoryIncident(null);
      setVerificationHistory([]);
      setHistoryError("");
    };

  const handleStatusAction = (
    incident
  ) => {
    if (user?.role !== "Admin") {
      return;
    }

    if (
      incident.status === "Reported"
    ) {
      updateIncident(
        incident._id,
        {
          status: "Under Review",
        }
      );

      return;
    }

    if (
      incident.status === "Verified"
    ) {
      updateIncident(
        incident._id,
        {
          status: "Active",
        }
      );

      return;
    }

    if (
      incident.status === "Active"
    ) {
      const resolutionNotes = window.prompt(
        "Enter resolution notes:"
      )?.trim();

      if (!resolutionNotes) {
        return;
      }

      updateIncident(
        incident._id,
        {
          status: "Resolved",
          resolutionNotes,
        }
      );
    } else if (incident.status === "Resolved") {
      updateIncident(
        incident._id,
        {
          status: "Archived",
        }
      );
    }
  };

  const getNextAction = (
    incident
  ) => {
    if (
      incident.status === "Reported"
    ) {
      return "Start Review";
    }

    if (
      incident.status === "Verified"
    ) {
      return "Activate";
    }

    if (
      incident.status === "Active"
    ) {
      return "Resolve";
    }

    if (
      incident.status === "Resolved"
    ) {
      return "Archive";
    }

    return null;
  };

  const canVerify = user?.role === "Admin";

  if (!token) {
    return (
      <PageShell>
        <div className="px-6 py-10">
          <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            Authentication required.
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              CrisisOps
            </p>

            <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h1 className="text-3xl font-black tracking-tight">
                  Incident Operations
                </h1>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Monitor, review, verify and manage
                  emergency incidents.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Logged in as
                </p>

                <p className="mt-1 font-semibold">
                  {user?.name || "User"}
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.role ||
                    "Unknown role"}
                  {user?.isFieldVerifier
                    ? " · Field Verifier"
                    : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <form
              onSubmit={handleSearch}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-6"
            >
              <div className="lg:col-span-2">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Search
                </label>

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Title, description, location..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {statusOptions.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Priority
                </label>

                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  {priorityOptions.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Type
                </label>

                <input
                  value={type}
                  onChange={(event) =>
                    setType(
                      event.target.value
                    )
                  }
                  placeholder="Flood"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Location
                </label>

                <input
                  value={location}
                  onChange={(event) =>
                    setLocation(
                      event.target.value
                    )
                  }
                  placeholder="Location"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <div className="flex gap-3 md:col-span-2 lg:col-span-6">
                <button
                  type="submit"
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  Apply Filters
                </button>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {pagination.total} incident
              {pagination.total === 1
                ? ""
                : "s"} found
            </p>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Page {pagination.page} of{" "}
              {pagination.totalPages}
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Loading incidents...
            </div>
          ) : incidents.length ===
            0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold">
                No incidents found
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Try changing the filters or search
                terms.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map(
                (incident) => {
                  const nextAction =
                    getNextAction(
                      incident
                    );

                  const actionKeyPrefix =
                    `${incident._id}-`;

                  const verificationAvailable =
                    [
                      "Reported",
                      "Under Review",
                    ].includes(
                      incident.status
                    );

                  return (
                    <div
                      key={incident._id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(
                                incident.status
                              )}`}
                            >
                              {incident.status}
                            </span>

                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-medium ${getPriorityClasses(
                                incident.priority
                              )}`}
                            >
                              {incident.priority}
                            </span>

                            <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {incident.normalizedType ||
                                incident.type ||
                                "Other"}
                            </span>
                          </div>

                          <h2 className="mt-4 text-xl font-black">
                            {incident.title}
                          </h2>

                          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                            {incident.description ||
                              "No description provided."}
                          </p>

                          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-400">
                                Location
                              </p>

                              <p className="mt-1 text-slate-700 dark:text-slate-300">
                                {incident.location
                                  ?.address ||
                                  "—"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-400">
                                Affected
                              </p>

                              <p className="mt-1 text-slate-700 dark:text-slate-300">
                                {incident.estimatedPeopleAffected ??
                                  0}{" "}
                                people
                              </p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-400">
                                Reported By
                              </p>

                              <p className="mt-1 text-slate-700 dark:text-slate-300">
                                {incident
                                  .reportedBy
                                  ?.name ||
                                  "Unknown"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-400">
                                Reported At
                              </p>

                              <p className="mt-1 text-slate-700 dark:text-slate-300">
                                {formatDate(
                                  incident.createdAt
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                openVerificationHistory(
                                  incident
                                )
                              }
                              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              Verification History
                            </button>
                          </div>
                        </div>

                        {user?.role ===
                          "Admin" && (
                          <div className="w-full lg:w-64">
                            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                              Operational Control
                            </p>

                            <select
                              value={
                                incident.priority
                              }
                              onChange={(
                                event
                              ) =>
                                updateIncident(
                                  incident._id,
                                  {
                                    priority:
                                      event
                                        .target
                                        .value,
                                  }
                                )
                              }
                              disabled={actionLoading.startsWith(
                                actionKeyPrefix
                              )}
                              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            >
                              <option value="Low">
                                Low
                              </option>

                              <option value="Medium">
                                Medium
                              </option>

                              <option value="High">
                                High
                              </option>

                              <option value="Critical">
                                Critical
                              </option>
                            </select>

                            {nextAction && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleStatusAction(
                                    incident
                                  )
                                }
                                disabled={actionLoading.startsWith(
                                  actionKeyPrefix
                                )}
                                className="mt-3 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                              >
                                {actionLoading.startsWith(
                                  actionKeyPrefix
                                )
                                  ? "Updating..."
                                  : nextAction}
                              </button>
                            )}

                            {canVerify &&
                              verificationAvailable && (
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openVerification(
                                        incident,
                                        "Verified"
                                      )
                                    }
                                    className="rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                                  >
                                    Verify
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      openVerification(
                                        incident,
                                        "Rejected"
                                      )
                                    }
                                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                          </div>
                        )}

                        {user?.role !==
                          "Admin" &&
                          canVerify &&
                          verificationAvailable && (
                            <div className="w-full lg:w-64">
                              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                                Field Verification
                              </p>

                              <button
                                type="button"
                                onClick={() =>
                                  openVerification(
                                    incident,
                                    "Verified"
                                  )
                                }
                                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                              >
                                Verify Incident
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openVerification(
                                    incident,
                                    "Rejected"
                                  )
                                }
                                className="mt-2 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                              >
                                Reject Incident
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              disabled={
                pagination.page <= 1 ||
                loading
              }
              onClick={() =>
                fetchIncidents(
                  pagination.page - 1
                )
              }
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={
                pagination.page >=
                  pagination.totalPages ||
                loading
              }
              onClick={() =>
                fetchIncidents(
                  pagination.page + 1
                )
              }
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Incident Verification
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  {selectedIncident.title}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Current status:{" "}
                  {selectedIncident.status}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeVerification
                }
                disabled={
                  verificationLoading
                }
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={
                submitVerification
              }
              className="mt-6"
            >
              <label className="mb-2 block text-sm font-semibold">
                Decision
              </label>

              <select
                value={
                  verificationAction
                }
                onChange={(event) =>
                  setVerificationAction(
                    event.target.value
                  )
                }
                disabled={
                  verificationLoading
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="Verified">
                  Verified
                </option>

                <option value="Rejected">
                  Rejected
                </option>
              </select>

              <label className="mt-5 mb-2 block text-sm font-semibold">
                Verification Notes
                {verificationAction ===
                  "Rejected" && (
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                )}
              </label>

              <textarea
                value={
                  verificationNotes
                }
                onChange={(event) =>
                  setVerificationNotes(
                    event.target.value
                  )
                }
                rows={5}
                maxLength={1000}
                placeholder={
                  verificationAction ===
                  "Rejected"
                    ? "Explain why this incident is being rejected."
                    : "Describe what was verified or observed."
                }
                disabled={
                  verificationLoading
                }
                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950"
              />

              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>
                  {verificationAction ===
                  "Rejected"
                    ? "Required for rejection."
                    : "Optional for verification."}
                </span>

                <span>
                  {
                    verificationNotes.length
                  }
                  /1000
                </span>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={
                    closeVerification
                  }
                  disabled={
                    verificationLoading
                  }
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    verificationLoading ||
                    (verificationAction ===
                      "Rejected" &&
                      !verificationNotes.trim())
                  }
                  className={
                    verificationAction ===
                    "Rejected"
                      ? "flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      : "flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  }
                >
                  {verificationLoading
                    ? "Saving..."
                    : verificationAction ===
                        "Rejected"
                      ? "Reject Incident"
                      : "Verify Incident"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Verification History
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  {historyIncident.title}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Current status:{" "}
                  {historyIncident.status}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeVerificationHistory
                }
                disabled={
                  historyLoading
                }
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6">
              {historyError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {historyError}
                </div>
              )}

              {historyLoading ? (
                <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  Loading verification history...
                </div>
              ) : !historyError &&
                verificationHistory.length ===
                  0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                  <h3 className="font-semibold">
                    No verification records
                  </h3>

                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    This incident has not been
                    verified or rejected yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {verificationHistory.map(
                    (verification) => (
                      <div
                        key={
                          verification._id
                        }
                        className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getVerificationClasses(
                                verification.action
                              )}`}
                            >
                              {
                                verification.action
                              }
                            </span>

                            <p className="mt-3 text-sm font-semibold">
                              {verification
                                .verifiedBy
                                ?.name ||
                                "Unknown verifier"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {verification
                                .verifiedBy
                                ?.role ||
                                "Unknown role"}
                              {verification
                                .verifiedBy
                                ?.isFieldVerifier
                                ? " · Field Verifier"
                                : ""}
                            </p>
                          </div>

                          <p className="text-xs text-slate-400">
                            {formatDate(
                              verification.createdAt
                            )}
                          </p>
                        </div>

                        <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Notes
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                            {verification.notes ||
                              "No notes provided."}
                          </p>
                        </div>

                        {verification
                          .observedLocation
                          ?.address && (
                          <div className="mt-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                              Observed Location
                            </p>

                            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                              {
                                verification
                                  .observedLocation
                                  .address
                              }
                            </p>
                          </div>
                        )}

                        {verification.evidence
                          ?.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                              Evidence
                            </p>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              {
                                verification
                                  .evidence
                                  .length
                              }{" "}
                              evidence item
                              {verification
                                .evidence
                                .length ===
                              1
                                ? ""
                                : "s"}
                              recorded.
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-4 dark:border-slate-800">
              <button
                type="button"
                onClick={
                  closeVerificationHistory
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

export default IncidentDashboard;