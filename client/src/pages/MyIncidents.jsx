import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import PageShell from "../components/PageShell";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const getStatusClasses = (
  status
) => {
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
      "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",

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

function MyIncidents() {
  const navigate = useNavigate();

  const token = localStorage.getItem(
    "crisisops_token"
  );

  const [incidents, setIncidents] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [deletingId, setDeletingId] =
    useState("");

  const fetchMyIncidents =
    useCallback(
      async (showRefresh = false) => {
        if (!token) {
          setError(
            "Your session has expired. Please log in again."
          );

          setLoading(false);
          return;
        }

        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const response =
            await fetch(
              `${API_URL}/api/incidents/mine`,
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
                "Failed to load your incidents."
            );
          }

          setIncidents(
            data.incidents || []
          );
        } catch (requestError) {
          setError(
            requestError.message ||
              "Unable to load your incidents."
          );

          setIncidents([]);
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [token]
    );

  useEffect(() => {
    fetchMyIncidents();
  }, [fetchMyIncidents]);

  const handleDelete = async (
    incidentId
  ) => {
    const confirmed =
      window.confirm(
        "Delete this incident report? This action cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(incidentId);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/incidents/${incidentId}`,
        {
          method: "DELETE",
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
            "Unable to delete the incident."
        );
      }

      setIncidents(
        (current) =>
          current.filter(
            (incident) =>
              incident._id !==
              incidentId
          )
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to delete the incident."
      );
    } finally {
      setDeletingId("");
    }
  };

  const reportedCount =
    incidents.length;

  const activeCount =
    incidents.filter((incident) =>
      [
        "Under Review",
        "Verified",
        "Active",
      ].includes(
        incident.status
      )
    ).length;

  const resolvedCount =
    incidents.filter(
      (incident) =>
        incident.status ===
        "Resolved"
    ).length;

  return (
    <PageShell>
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Citizen Portal
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  My Incidents
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                  Track emergency reports that you have
                  submitted through CrisisOps.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    fetchMyIncidents(
                      true
                    )
                  }
                  disabled={refreshing}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {refreshing
                    ? "Refreshing..."
                    : "Refresh"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/report-incident"
                    )
                  }
                  className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  Report Incident
                </button>
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Total Reports
              </p>

              <p className="mt-2 text-3xl font-black">
                {reportedCount}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                In Progress
              </p>

              <p className="mt-2 text-3xl font-black text-blue-600 dark:text-blue-400">
                {activeCount}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Resolved
              </p>

              <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {resolvedCount}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Loading your incidents...
            </div>
          ) : incidents.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-sm font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                00
              </div>

              <h2 className="mt-5 text-xl font-black">
                No incidents reported yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400">
                Your emergency reports will appear here after
                you submit them.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/report-incident"
                  )
                }
                className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Report Your First Incident
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map(
                (incident) => (
                  <article
                    key={incident._id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(
                              incident.status
                            )}`}
                          >
                            {incident.status ||
                              "Reported"}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${getPriorityClasses(
                              incident.priority
                            )}`}
                          >
                            {incident.priority ||
                              "Medium"}
                          </span>

                          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {incident.normalizedType ||
                              incident.type ||
                              "Other"}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400">
                          Reported{" "}
                          {formatDate(
                            incident.createdAt
                          )}
                        </p>
                      </div>

                      <div>
                        <h2 className="text-xl font-black">
                          {incident.title ||
                            "Untitled Incident"}
                        </h2>

                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">
                          {incident.description ||
                            "No description provided."}
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                            Location
                          </p>

                          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                            {incident.location
                              ?.address ||
                              "—"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                            People Affected
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {incident.estimatedPeopleAffected ??
                              0}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                            Disaster
                          </p>

                          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                            {incident.disaster
                              ?.name ||
                              "Not associated"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                            Updated
                          </p>

                          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                            {formatDate(
                              incident.updatedAt
                            )}
                          </p>
                        </div>
                      </div>

                      {incident.rejectionReason && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                          <p className="text-xs font-bold uppercase tracking-wide text-red-600 dark:text-red-400">
                            Rejection Reason
                          </p>

                          <p className="mt-1 text-sm leading-6 text-red-700 dark:text-red-300">
                            {
                              incident.rejectionReason
                            }
                          </p>
                        </div>
                      )}

                      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
                        {(incident.status ===
                          "Reported" ||
                          incident.status ===
                            "Under Review") && (
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/report-incident?edit=${incident._id}`
                              )
                            }
                            className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            Edit Report
                          </button>
                        )}

                        {incident.status ===
                          "Reported" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                incident._id
                              )
                            }
                            disabled={
                              deletingId ===
                              incident._id
                            }
                            className="rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            {deletingId ===
                            incident._id
                              ? "Deleting..."
                              : "Delete Report"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

export default MyIncidents;