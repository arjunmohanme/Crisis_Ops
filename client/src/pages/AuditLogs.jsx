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

const getToken = () =>
  localStorage.getItem("crisisops_token");

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

const formatMetadata = (metadata) => {
  if (!metadata) {
    return "No additional metadata";
  }

  try {
    return JSON.stringify(
      metadata,
      null,
      2
    );
  } catch {
    return "Metadata unavailable";
  }
};

function AuditLogs() {
  const token = getToken();

  const [auditLogs, setAuditLogs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [entityType, setEntityType] =
    useState("All");

  const [expandedId, setExpandedId] =
    useState(null);

  const fetchAuditLogs = useCallback(
    async (refresh = false) => {
      if (!token) {
        setError(
          "Authentication required."
        );
        setLoading(false);
        return;
      }

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await fetch(
          `${API_URL}/api/audit-logs`,
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
              "Unable to load audit logs."
          );
        }

        setAuditLogs(
          data.auditLogs || []
        );
      } catch (requestError) {
        setError(
          requestError.message ||
            "Unable to load audit logs."
        );

        setAuditLogs([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const entityTypes = useMemo(() => {
    const values = auditLogs
      .map(
        (log) =>
          log.entityType
      )
      .filter(Boolean);

    return [
      "All",
      ...Array.from(
        new Set(values)
      ).sort(),
    ];
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return auditLogs.filter((log) => {
      const actorName =
        log.actor?.name?.toLowerCase() ||
        "";

      const actorEmail =
        log.actor?.email?.toLowerCase() ||
        "";

      const action =
        log.action?.toLowerCase() ||
        "";

      const type =
        log.entityType?.toLowerCase() ||
        "";

      const entityId =
        log.entityId?.toLowerCase() ||
        "";

      const matchesSearch =
        !query ||
        actorName.includes(query) ||
        actorEmail.includes(query) ||
        action.includes(query) ||
        type.includes(query) ||
        entityId.includes(query);

      const matchesEntity =
        entityType === "All" ||
        log.entityType ===
          entityType;

      return (
        matchesSearch &&
        matchesEntity
      );
    });
  }, [
    auditLogs,
    search,
    entityType,
  ]);

  const summary = useMemo(
    () => ({
      total: auditLogs.length,

      users: auditLogs.filter(
        (log) =>
          log.entityType ===
          "User"
      ).length,

      incidents: auditLogs.filter(
        (log) =>
          log.entityType ===
          "Incident"
      ).length,

      resources: auditLogs.filter(
        (log) =>
          log.entityType ===
          "Resource"
      ).length,
    }),
    [auditLogs]
  );

  const toggleExpanded = (id) => {
    setExpandedId((current) =>
      current === id
        ? null
        : id
    );
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Administration
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Audit Logs
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Review sensitive operational actions
              recorded across the CrisisOps platform.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              fetchAuditLogs(true)
            }
            disabled={refreshing}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total Actions
            </p>

            <p className="mt-2 text-3xl font-black">
              {summary.total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              User Actions
            </p>

            <p className="mt-2 text-3xl font-black">
              {summary.users}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Incident Actions
            </p>

            <p className="mt-2 text-3xl font-black">
              {summary.incidents}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Resource Actions
            </p>

            <p className="mt-2 text-3xl font-black">
              {summary.resources}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Search
              </label>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search actor, action, entity or ID..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Entity Type
              </label>

              <select
                value={entityType}
                onChange={(event) =>
                  setEntityType(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
              >
                {entityTypes.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Loading audit logs...
          </div>
        ) : filteredLogs.length ===
          0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">
              No audit logs found
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              No records match the current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="hidden border-b border-slate-200 px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-400 dark:border-slate-800 md:grid md:grid-cols-[1.2fr_1fr_1fr_1fr_auto] md:gap-4">
              <span>Actor</span>
              <span>Action</span>
              <span>Entity</span>
              <span>Time</span>
              <span></span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredLogs.map(
                (log) => {
                  const id =
                    log._id ||
                    `${log.entityType}-${log.entityId}-${log.createdAt}`;

                  const expanded =
                    expandedId === id;

                  return (
                    <div
                      key={id}
                      className="px-6 py-5"
                    >
                      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr_1fr_auto] md:items-center">
                        <div>
                          <p className="font-semibold">
                            {log.actor?.name ||
                              "Unknown user"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {log.actor
                              ?.email ||
                              "No email"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {log.actor
                              ?.role ||
                              "Unknown role"}
                          </p>
                        </div>

                        <div>
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {log.action}
                          </span>
                        </div>

                        <div>
                          <p className="text-sm font-semibold">
                            {log.entityType}
                          </p>

                          <p className="mt-1 break-all text-xs text-slate-400">
                            {log.entityId}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {formatDate(
                              log.createdAt
                            )}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            toggleExpanded(
                              id
                            )
                          }
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                        >
                          {expanded
                            ? "Hide"
                            : "Details"}
                        </button>
                      </div>

                      {expanded && (
                        <div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                            Metadata
                          </p>

                          <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-600 dark:text-slate-400">
                            {formatMetadata(
                              log.metadata
                            )}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

export default AuditLogs;