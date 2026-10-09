import { useCallback, useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const getToken = () =>
  localStorage.getItem("crisisops_token");

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

function UserManagement() {
  const token = getToken();

  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [controlLoading, setControlLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState("");

  const [rejectingId, setRejectingId] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchApplications = useCallback(
    async (refresh = false) => {
      if (!token) {
        setError("Authentication required.");
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
          `${API_URL}/api/users/pending`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load pending applications."
          );
        }

        setApplications(data.applications || []);
      } catch (requestError) {
        setError(
          requestError.message ||
            "Unable to load pending applications."
        );
        setApplications([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  const fetchUsers = useCallback(async () => {
    if (!token) return;

    setControlLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load users."
        );
      }

      setUsers(data.users || []);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to load users."
      );
      setUsers([]);
    } finally {
      setControlLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchApplications();
    fetchUsers();
  }, [fetchApplications, fetchUsers]);

  const toggleUserBlock = async (user) => {
    const blocked = !user.isBlocked;

    setActionId(user._id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/api/users/${user._id}/account-status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ blocked }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update account status."
        );
      }

      setSuccess(
        `${user.name} is now ${
          blocked ? "blocked" : "active"
        }.`
      );

      await fetchUsers();
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to update account status."
      );
    } finally {
      setActionId("");
    }
  };

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesRole =
        roleFilter === "All" ||
        application.requestedRole === roleFilter;

      const matchesSearch =
        !query ||
        application.name
          ?.toLowerCase()
          .includes(query) ||
        application.email
          ?.toLowerCase()
          .includes(query) ||
        application.phone
          ?.toLowerCase()
          .includes(query);

      return matchesRole && matchesSearch;
    });
  }, [applications, search, roleFilter]);

  const summary = useMemo(
    () => ({
      total: applications.length,

      volunteers: applications.filter(
        (application) =>
          application.requestedRole === "Volunteer"
      ).length,

      organizations: applications.filter(
        (application) =>
          application.requestedRole === "Organization"
      ).length,
    }),
    [applications]
  );

  const approveApplication = async (application) => {
    const id = application._id || application.id;

    setActionId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/api/users/${id}/approve`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to approve application."
        );
      }

      setSuccess(
        `${application.name}'s ${application.requestedRole.toLowerCase()} application was approved.`
      );

      await fetchApplications(true);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to approve application."
      );
    } finally {
      setActionId("");
    }
  };

  const openReject = (application) => {
    const id = application._id || application.id;

    setRejectingId(id);
    setRejectionReason("");
    setError("");
    setSuccess("");
  };

  const closeReject = () => {
    setRejectingId("");
    setRejectionReason("");
  };

  const rejectApplication = async (application) => {
    const id = application._id || application.id;
    const reason = rejectionReason.trim();

    if (!reason) {
      setError("A rejection reason is required.");
      return;
    }

    setActionId(id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/api/users/${id}/reject`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rejectionReason: reason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to reject application."
        );
      }

      setSuccess(
        `${application.name}'s application was rejected.`
      );

      closeReject();

      await fetchApplications(true);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to reject application."
      );
    } finally {
      setActionId("");
    }
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
              User Management
            </h1>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Review pending Volunteer and Organization
              registration applications.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchApplications(true);
              fetchUsers();
            }}
            disabled={refreshing}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
            {success}
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pending Applications
            </p>

            <p className="mt-2 text-3xl font-black">
              {summary.total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Volunteer Requests
            </p>

            <p className="mt-2 text-3xl font-black">
              {summary.volunteers}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Organization Requests
            </p>

            <p className="mt-2 text-3xl font-black">
              {summary.organizations}
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row">
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search name, email or phone..."
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950"
          />

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value)
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="All">
              All Requests
            </option>

            <option value="Volunteer">
              Volunteer
            </option>

            <option value="Organization">
              Organization
            </option>
          </select>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Loading pending applications...
          </div>
        ) : filteredApplications.length ===
          0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">
              No pending applications
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              There are no applications matching the
              current filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {filteredApplications.map(
              (application) => {
                const id =
                  application._id ||
                  application.id;

                const isBusy =
                  actionId === id;

                const isRejecting =
                  rejectingId === id;

                return (
                  <div
                    key={id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold">
                          {application.name}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {application.email}
                        </p>
                      </div>

                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                        {application.requestedRole}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Phone
                        </p>

                        <p className="mt-1 text-sm">
                          {application.phone ||
                            "Not provided"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Applied At
                        </p>

                        <p className="mt-1 text-sm">
                          {formatDate(
                            application.createdAt
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Account Status
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {application.accountStatus}
                      </p>
                    </div>

                    {isRejecting ? (
                      <div className="mt-5">
                        <label className="mb-2 block text-sm font-semibold">
                          Rejection Reason
                        </label>

                        <textarea
                          value={rejectionReason}
                          onChange={(event) =>
                            setRejectionReason(
                              event.target.value
                            )
                          }
                          rows={4}
                          maxLength={500}
                          placeholder="Explain why the application is being rejected."
                          className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-950"
                        />

                        <div className="mt-3 flex gap-3">
                          <button
                            type="button"
                            onClick={
                              closeReject
                            }
                            disabled={isBusy}
                            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold dark:border-slate-700"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              rejectApplication(
                                application
                              )
                            }
                            disabled={
                              isBusy ||
                              !rejectionReason.trim()
                            }
                            className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isBusy
                              ? "Rejecting..."
                              : "Confirm Reject"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 flex gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            approveApplication(
                              application
                            )
                          }
                          disabled={isBusy}
                          className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isBusy
                            ? "Processing..."
                            : "Approve"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openReject(
                              application
                            )
                          }
                          disabled={isBusy}
                          className="flex-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Account Control
              </p>
              <h2 className="mt-2 text-xl font-black">
                Active User Accounts
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Block or unblock accounts. Passwords and secrets are never exposed.
              </p>
            </div>
            <span className="text-sm text-slate-400">
              {users.length} users
            </span>
          </div>

          {controlLoading ? (
            <p className="text-sm text-slate-500">
              Loading users...
            </p>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-500">
              No users found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="px-3 py-3 font-bold">User</th>
                    <th className="px-3 py-3 font-bold">Role</th>
                    <th className="px-3 py-3 font-bold">Status</th>
                    <th className="px-3 py-3 text-right font-bold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((account) => {
                    const busy = actionId === account._id;
                    return (
                      <tr
                        key={account._id}
                        className="border-b border-slate-100 last:border-0 dark:border-slate-800/70"
                      >
                        <td className="px-3 py-4">
                          <p className="font-semibold">
                            {account.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {account.email}
                          </p>
                        </td>
                        <td className="px-3 py-4">
                          {account.role}
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              account.isBlocked
                                ? "bg-red-50 text-red-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {account.isBlocked ? "Blocked" : "Active"}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              toggleUserBlock(account)
                            }
                            disabled={busy}
                            className={`rounded-xl px-4 py-2 text-xs font-bold ${
                              account.isBlocked
                                ? "bg-emerald-600 text-white"
                                : "border border-red-200 text-red-700"
                            } disabled:opacity-50`}
                          >
                            {busy
                              ? "Updating..."
                              : account.isBlocked
                                ? "Unblock"
                                : "Block"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}

export default UserManagement;