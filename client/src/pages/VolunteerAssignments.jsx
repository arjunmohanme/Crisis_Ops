import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import PageShell from "../components/PageShell";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const EMPTY_FORM = {
  incident: "",
  volunteer: "",
  task: "",
  notes: "",
};

const getUser = () => {
  try {
    return JSON.parse(
      localStorage.getItem("crisisops_user") || "null"
    );
  } catch {
    return null;
  }
};

const getToken = () =>
  localStorage.getItem("crisisops_token");

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    dateStyle: "medium",
  });
};

const statusClass = (status) => {
  const classes = {
    Assigned:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",

    Accepted:
      "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300",

    "In Progress":
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",

    Completed:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",

    Rejected:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",

    Cancelled:
      "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
  };

  return (
    classes[status] ||
    "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
  );
};

function VolunteerAssignments() {
  const user = getUser();
  const token = getToken();

  const isAdmin = user?.role === "Admin";
  const isVolunteer = user?.role === "Volunteer";

  const [assignments, setAssignments] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [volunteers, setVolunteers] = useState([]);

  const [form, setForm] = useState(EMPTY_FORM);

  const [loading, setLoading] = useState(true);
  const [loadingFormData, setLoadingFormData] =
    useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [search, setSearch] = useState("");

  const [completionNotes, setCompletionNotes] =
    useState({});

  const fetchAssignments = useCallback(
    async (refresh = false) => {
      if (!token) {
        setError(
          "Your session has expired. Please log in again."
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
        const endpoint = isAdmin
          ? `${API_URL}/api/volunteer-assignments`
          : `${API_URL}/api/volunteer-assignments/mine`;

        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load volunteer assignments."
          );
        }

        setAssignments(data.assignments || []);
      } catch (requestError) {
        setError(
          requestError.message ||
            "Unable to load volunteer assignments."
        );
        setAssignments([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, isAdmin]
  );

  const fetchFormData = useCallback(async () => {
    if (!token || !isAdmin) return;

    setLoadingFormData(true);

    try {
      const [incidentResponse, volunteerResponse] =
        await Promise.all([
          fetch(
            `${API_URL}/api/incidents?limit=100`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ),

          fetch(
            `${API_URL}/api/volunteers/available`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          ),
        ]);

      const incidentData =
        await incidentResponse.json();

      const volunteerData =
        await volunteerResponse.json();

      if (!incidentResponse.ok) {
        throw new Error(
          incidentData.message ||
            "Unable to load incidents."
        );
      }

      if (!volunteerResponse.ok) {
        throw new Error(
          volunteerData.message ||
            "Unable to load available volunteers."
        );
      }

      const availableIncidents = (
        incidentData.incidents || []
      ).filter(
        (incident) =>
          incident.status === "Verified" ||
          incident.status === "Active"
      );

      setIncidents(availableIncidents);
      setVolunteers(
        volunteerData.volunteers || []
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to load assignment data."
      );
      setIncidents([]);
      setVolunteers([]);
    } finally {
      setLoadingFormData(false);
    }
  }, [token, isAdmin]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    fetchFormData();
  }, [fetchFormData]);

  const filteredAssignments = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const incidentTitle =
        assignment.incident?.title?.toLowerCase() || "";

      const volunteerName =
        assignment.volunteer?.name?.toLowerCase() || "";

      const task =
        assignment.task?.toLowerCase() || "";

      const matchesSearch =
        !normalizedSearch ||
        incidentTitle.includes(normalizedSearch) ||
        volunteerName.includes(normalizedSearch) ||
        task.includes(normalizedSearch);

      const matchesStatus =
        !statusFilter ||
        assignment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [assignments, search, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: assignments.length,

      active: assignments.filter((item) =>
        ["Assigned", "Accepted", "In Progress"].includes(
          item.status
        )
      ).length,

      completed: assignments.filter(
        (item) => item.status === "Completed"
      ).length,

      rejected: assignments.filter(
        (item) => item.status === "Rejected"
      ).length,
    };
  }, [assignments]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAssign = async (event) => {
    event.preventDefault();

    if (!form.incident) {
      setError("Please select an incident.");
      return;
    }

    if (!form.volunteer) {
      setError("Please select a volunteer.");
      return;
    }

    if (!form.task.trim()) {
      setError("Please enter the assignment task.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/api/volunteer-assignments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            incident: form.incident,
            volunteer: form.volunteer,
            task: form.task.trim(),
            notes: form.notes.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to assign volunteer."
        );
      }

      setSuccess(
        "Volunteer assigned successfully."
      );

      setForm(EMPTY_FORM);

      await fetchAssignments(true);
      await fetchFormData();
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to assign volunteer."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateAssignment = async (
    assignmentId,
    status,
    notes = ""
  ) => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/api/volunteer-assignments/${assignmentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            completionNotes: notes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update assignment."
        );
      }

      setSuccess(
        "Assignment updated successfully."
      );

      setCompletionNotes((current) => {
        const next = { ...current };
        delete next[assignmentId];
        return next;
      });

      await fetchAssignments(true);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to update assignment."
      );
    }
  };

  const cancelAssignment = async (assignmentId) => {
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/api/volunteer-assignments/${assignmentId}/cancel`,
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
            "Unable to cancel assignment."
        );
      }

      setSuccess(
        "Assignment cancelled successfully."
      );

      await fetchAssignments(true);
      await fetchFormData();
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to cancel assignment."
      );
    }
  };

  if (!isAdmin && !isVolunteer) {
    return (
      <PageShell>
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
            You are not authorized to access volunteer
            assignments.
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Volunteer Operations
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {isAdmin
              ? "Assign Volunteer"
              : "My Assignments"}
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
            {isAdmin
              ? "Assign available volunteers to verified or active incidents."
              : "Review and update your assigned emergency response tasks."}
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
            {success}
          </div>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total Assignments
            </p>

            <p className="mt-2 text-3xl font-bold">
              {summary.total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Active
            </p>

            <p className="mt-2 text-3xl font-bold">
              {summary.active}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Completed
            </p>

            <p className="mt-2 text-3xl font-bold">
              {summary.completed}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Rejected
            </p>

            <p className="mt-2 text-3xl font-bold">
              {summary.rejected}
            </p>
          </div>
        </div>

        {isAdmin && (
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">
                Assign Volunteer
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Only active, verified/active incidents and
                available volunteers can be assigned.
              </p>
            </div>

            {loadingFormData ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                Loading incidents and available
                volunteers...
              </div>
            ) : (
              <form
                onSubmit={handleAssign}
                className="grid gap-5 md:grid-cols-2"
              >
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Incident
                  </label>

                  <select
                    name="incident"
                    value={form.incident}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                  >
                    <option value="">
                      Select incident
                    </option>

                    {incidents.map((incident) => (
                      <option
                        key={incident._id}
                        value={incident._id}
                      >
                        {incident.title} —{" "}
                        {incident.status}
                      </option>
                    ))}
                  </select>

                  {incidents.length === 0 && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      No verified or active incidents are
                      available.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Volunteer
                  </label>

                  <select
                    name="volunteer"
                    value={form.volunteer}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                  >
                    <option value="">
                      Select volunteer
                    </option>

                    {volunteers.map((volunteer) => (
                      <option
                        key={volunteer._id}
                        value={volunteer._id}
                      >
                        {volunteer.name}
                        {volunteer.skills?.length
                          ? ` — ${volunteer.skills.join(
                              ", "
                            )}`
                          : ""}
                      </option>
                    ))}
                  </select>

                  {volunteers.length === 0 && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      No available volunteers found.
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">
                    Assignment Task
                  </label>

                  <textarea
                    name="task"
                    value={form.task}
                    onChange={handleChange}
                    rows={3}
                    maxLength={500}
                    placeholder="Describe the task assigned to the volunteer."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">
                    Additional Notes
                  </label>

                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    rows={3}
                    maxLength={1000}
                    placeholder="Optional operational notes."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={
                      saving ||
                      !form.incident ||
                      !form.volunteer ||
                      !form.task.trim()
                    }
                    className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
                  >
                    {saving
                      ? "Assigning..."
                      : "Assign Volunteer"}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-6 dark:border-slate-800">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Assignment Records
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Track the current state of volunteer
                  assignments.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search assignments..."
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
                />

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="">All statuses</option>
                  <option value="Assigned">
                    Assigned
                  </option>
                  <option value="Accepted">
                    Accepted
                  </option>
                  <option value="In Progress">
                    In Progress
                  </option>
                  <option value="Completed">
                    Completed
                  </option>
                  <option value="Rejected">
                    Rejected
                  </option>
                  <option value="Cancelled">
                    Cancelled
                  </option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    fetchAssignments(true);
                    fetchFormData();
                  }}
                  disabled={refreshing}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium dark:border-slate-700 dark:bg-slate-950"
                >
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading assignments...
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No assignment records found.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredAssignments.map((assignment) => {
                const incident =
                  assignment.incident;

                const volunteer =
                  assignment.volunteer;

                const notes =
                  completionNotes[
                    assignment._id
                  ] || "";

                return (
                  <div
                    key={assignment._id}
                    className="p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold">
                            {incident?.title ||
                              "Unknown incident"}
                          </h3>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
                              assignment.status
                            )}`}
                          >
                            {assignment.status}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <p>
                            <span className="font-medium text-slate-900 dark:text-slate-200">
                              Volunteer:
                            </span>{" "}
                            {volunteer?.name ||
                              "Unknown volunteer"}
                          </p>

                          <p>
                            <span className="font-medium text-slate-900 dark:text-slate-200">
                              Task:
                            </span>{" "}
                            {assignment.task}
                          </p>

                          <p>
                            <span className="font-medium text-slate-900 dark:text-slate-200">
                              Assigned:
                            </span>{" "}
                            {formatDate(
                              assignment.assignedAt
                            )}
                          </p>

                          {assignment.notes && (
                            <p>
                              <span className="font-medium text-slate-900 dark:text-slate-200">
                                Notes:
                              </span>{" "}
                              {assignment.notes}
                            </p>
                          )}

                          {assignment.completionNotes && (
                            <p>
                              <span className="font-medium text-slate-900 dark:text-slate-200">
                                Completion:
                              </span>{" "}
                              {assignment.completionNotes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 lg:min-w-[220px]">
                        {isAdmin &&
                          ["Assigned", "Accepted", "In Progress"].includes(
                            assignment.status
                          ) && (
                            <button
                              type="button"
                              onClick={() =>
                                cancelAssignment(
                                  assignment._id
                                )
                              }
                              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
                            >
                              Cancel Assignment
                            </button>
                          )}

                        {isVolunteer &&
                          assignment.status ===
                            "Assigned" && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateAssignment(
                                    assignment._id,
                                    "Accepted"
                                  )
                                }
                                className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
                              >
                                Accept
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  updateAssignment(
                                    assignment._id,
                                    "Rejected"
                                  )
                                }
                                className="flex-1 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
                              >
                                Reject
                              </button>
                            </div>
                          )}

                        {isVolunteer &&
                          assignment.status ===
                            "Accepted" && (
                            <button
                              type="button"
                              onClick={() =>
                                updateAssignment(
                                  assignment._id,
                                  "In Progress"
                                )
                              }
                              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
                            >
                              Start Work
                            </button>
                          )}

                        {isVolunteer &&
                          assignment.status ===
                            "In Progress" && (
                            <div className="space-y-2">
                              <textarea
                                value={notes}
                                onChange={(event) =>
                                  setCompletionNotes(
                                    (current) => ({
                                      ...current,
                                      [assignment._id]:
                                        event.target
                                          .value,
                                    })
                                  )
                                }
                                rows={3}
                                placeholder="Enter completion notes..."
                                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
                              />

                              <button
                                type="button"
                                disabled={!notes.trim()}
                                onClick={() =>
                                  updateAssignment(
                                    assignment._id,
                                    "Completed",
                                    notes.trim()
                                  )
                                }
                                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Complete Assignment
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}

export default VolunteerAssignments;