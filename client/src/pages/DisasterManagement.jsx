import { useCallback, useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const EMPTY_FORM = {
  name: "",
  type: "",
  description: "",
  affectedLocations: "",
  startDate: "",
  endDate: "",
};

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("crisisops_user") || "null");
  } catch {
    return null;
  }
};

const getToken = () => localStorage.getItem("crisisops_token");

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    dateStyle: "medium",
  });
};

const toInputDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

const getTypeClass = (type) => {
  const classes = {
    Flood:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
    Landslide:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
    Earthquake:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
    Cyclone:
      "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
    Storm:
      "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300",
    Wildfire:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
    Drought:
      "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300",
    Tsunami:
      "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300",
    "Volcanic Eruption":
      "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
    "Industrial Accident":
      "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    Other:
      "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };

  return classes[type] || classes.Other;
};

const getStatusClass = (status) => {
  if (status === "Active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
  }

  return "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400";
};

function DisasterManagement() {
  const user = getUser();
  const token = getToken();
  const isAdmin = user?.role === "Admin";

  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchDisasters = useCallback(
    async (refresh = false) => {
      if (!token) {
        setError("Your session has expired. Please log in again.");
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
        const response = await fetch(`${API_URL}/api/disasters`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load disasters."
          );
        }

        setDisasters(data.disasters || []);
      } catch (requestError) {
        setError(
          requestError.message || "Unable to load disasters."
        );
        setDisasters([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchDisasters();
  }, [fetchDisasters]);

  const filteredDisasters = useMemo(() => {
    const query = search.trim().toLowerCase();

    return disasters.filter((disaster) => {
      const matchesSearch =
        !query ||
        disaster.name?.toLowerCase().includes(query) ||
        disaster.type?.toLowerCase().includes(query) ||
        disaster.normalizedType?.toLowerCase().includes(query) ||
        disaster.description?.toLowerCase().includes(query) ||
        disaster.affectedLocations?.some((location) =>
          location.toLowerCase().includes(query)
        );

      const matchesStatus =
        !statusFilter || disaster.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [disasters, search, statusFilter]);

  const activeCount = disasters.filter(
    (disaster) => disaster.status === "Active"
  ).length;

  const closedCount = disasters.filter(
    (disaster) => disaster.status === "Closed"
  ).length;

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId("");
    setShowForm(false);
  };

  const openCreateForm = () => {
    setError("");
    setSuccess("");
    setEditingId("");
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (disaster) => {
    setError("");
    setSuccess("");
    setEditingId(disaster._id);

    setForm({
      name: disaster.name || "",
      type: disaster.type || "",
      description: disaster.description || "",
      affectedLocations: (disaster.affectedLocations || []).join(", "),
      startDate: toInputDate(disaster.startDate),
      endDate: toInputDate(disaster.endDate),
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const affectedLocations = form.affectedLocations
      .split(",")
      .map((location) => location.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      type: form.type.trim(),
      description: form.description.trim(),
      affectedLocations,
      startDate: form.startDate,
    };

    if (form.endDate) {
      payload.endDate = form.endDate;
    }

    const editing = Boolean(editingId);

    try {
      const response = await fetch(
        editing
          ? `${API_URL}/api/disasters/${editingId}`
          : `${API_URL}/api/disasters`,
        {
          method: editing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const validationMessage = data.errors?.[0]?.msg;

        throw new Error(
          validationMessage ||
            data.message ||
            "Unable to save disaster."
        );
      }

      setSuccess(
        editing
          ? "Disaster updated successfully."
          : "Disaster created successfully."
      );

      resetForm();
      await fetchDisasters(true);
    } catch (requestError) {
      setError(
        requestError.message || "Unable to save disaster."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (disaster) => {
    if (
      !window.confirm(
        `Close "${disaster.name}"? A closed disaster cannot be modified.`
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/api/disasters/${disaster._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: "Closed",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to close disaster."
        );
      }

      setSuccess("Disaster closed successfully.");
      await fetchDisasters(true);
    } catch (requestError) {
      setError(
        requestError.message || "Unable to close disaster."
      );
    }
  };

  return (
    <PageShell>
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="mb-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  CrisisOps Coordination
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  Disasters
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                  Manage emergency events, affected locations
                  and lifecycle status.
                </p>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  Create Disaster
                </button>
              )}
            </div>
          </section>

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

          {showForm && isAdmin && (
            <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    {editingId ? "Update Record" : "New Record"}
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    {editingId ? "Edit Disaster" : "Create Disaster"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Disaster Name
                    </label>

                    <input
                      required
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Regional Flood Emergency"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Disaster Type
                    </label>

                    <input
                      required
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                      placeholder="Heavy river overflow"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />

                    <p className="mt-2 text-xs text-slate-400">
                      The backend normalizes this value automatically.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Start Date
                    </label>

                    <input
                      required
                      type="date"
                      name="startDate"
                      value={form.startDate}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      End Date
                    </label>

                    <input
                      type="date"
                      name="endDate"
                      value={form.endDate}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Affected Locations
                  </label>

                  <input
                    name="affectedLocations"
                    value={form.affectedLocations}
                    onChange={handleChange}
                    placeholder="Kowdiar, Pattom, Kazhakkoottam"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    Separate locations with commas.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    maxLength={1000}
                    placeholder="Describe the emergency event and current operational context."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Update Disaster"
                        : "Create Disaster"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Total
              </p>
              <p className="mt-2 text-3xl font-black">
                {disasters.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Active
              </p>
              <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {activeCount}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Closed
              </p>
              <p className="mt-2 text-3xl font-black text-slate-600 dark:text-slate-400">
                {closedCount}
              </p>
            </div>
          </section>

          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Search
                </label>

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search disaster, type or location..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Status
                </label>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">All statuses</option>
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("");
                  }}
                  className="w-full rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 md:w-auto dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => fetchDisasters(true)}
              disabled={refreshing}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Loading disasters...
            </div>
          ) : filteredDisasters.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-black">
                No disasters found
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                No disaster records match the current filters.
              </p>

              {isAdmin && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950"
                >
                  Create Disaster
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {filteredDisasters.map((disaster) => (
                <article
                  key={disaster._id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${getTypeClass(
                            disaster.normalizedType
                          )}`}
                        >
                          {disaster.normalizedType || "Other"}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClass(
                            disaster.status
                          )}`}
                        >
                          {disaster.status || "Unknown"}
                        </span>
                      </div>

                      <h2 className="mt-4 text-2xl font-black">
                        {disaster.name}
                      </h2>

                      <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                        Original type: {disaster.type}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Created
                      </p>

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {formatDate(disaster.createdAt)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-400">
                    {disaster.description || "No description provided."}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Start Date
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {formatDate(disaster.startDate)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        End Date
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {formatDate(disaster.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Affected Locations
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {disaster.affectedLocations?.length ? (
                        disaster.affectedLocations.map(
                          (location, index) => (
                            <span
                              key={`${disaster._id}-${index}`}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                            >
                              {location}
                            </span>
                          )
                        )
                      ) : (
                        <span className="text-sm text-slate-400">
                          No locations recorded
                        </span>
                      )}
                    </div>
                  </div>

                  {isAdmin && disaster.status === "Active" && (
                    <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => openEditForm(disaster)}
                        className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleClose(disaster)}
                        className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        Close Disaster
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

export default DisasterManagement;