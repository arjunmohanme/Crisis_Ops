import { useCallback, useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const EMPTY_FORM = {
  incident: "",
  resource: "",
  requestedQuantity: "",
  reason: "",
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

const STATUS_CLASSES = {
  Pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  "Partially Fulfilled":
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  Fulfilled:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
};

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

function ResourceRequests() {
  const user = getUser();
  const token = getToken();

  const role = user?.role;
  const isAdmin = role === "Admin";
  const canCreate =
    role === "Admin" ||
    role === "Organization" ||
    role === "Volunteer";

  const [requests, setRequests] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  const [organization, setOrganization] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingFormData, setLoadingFormData] =
    useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchRequests = useCallback(
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
          ? `${API_URL}/api/resource-requests`
          : `${API_URL}/api/resource-requests/mine`;

        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load resource requests."
          );
        }

        setRequests(data.resourceRequests || []);
      } catch (requestError) {
        setError(
          requestError.message ||
            "Unable to load resource requests."
        );
        setRequests([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, isAdmin]
  );

  const fetchFormData = useCallback(async () => {
    if (!token || !canCreate) {
      return;
    }

    setLoadingFormData(true);

    try {
      const incidentResponse = await fetch(
        `${API_URL}/api/incidents?status=Verified,Active&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const incidentData =
        await incidentResponse.json();

      if (!incidentResponse.ok) {
        throw new Error(
          incidentData.message ||
            "Unable to load incidents."
        );
      }

      setIncidents(incidentData.incidents || []);

      let resourceUrl = `${API_URL}/api/resources?limit=100`;

      if (role === "Organization") {
        const organizationResponse =
          await fetch(
            `${API_URL}/api/organizations/mine`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

        const organizationData =
          await organizationResponse.json();

        if (!organizationResponse.ok) {
          throw new Error(
            organizationData.message ||
              "Unable to load organization."
          );
        }

        setOrganization(
          organizationData.organization || null
        );

        if (organizationData.organization?._id) {
          resourceUrl = `${API_URL}/api/resources/organization/${organizationData.organization._id}`;
        }
      }

      const resourceResponse = await fetch(
        resourceUrl,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const resourceData =
        await resourceResponse.json();

      if (!resourceResponse.ok) {
        throw new Error(
          resourceData.message ||
            "Unable to load resources."
        );
      }

      setResources(resourceData.resources || []);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to load request data."
      );
    } finally {
      setLoadingFormData(false);
    }
  }, [token, canCreate, role]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    fetchFormData();
  }, [fetchFormData]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus =
        !statusFilter ||
        request.status === statusFilter;

      const matchesSearch =
        !query ||
        request.incident?.title
          ?.toLowerCase()
          .includes(query) ||
        request.resource?.name
          ?.toLowerCase()
          .includes(query) ||
        request.resource?.category
          ?.toLowerCase()
          .includes(query) ||
        request.requestedBy?.name
          ?.toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [requests, statusFilter, search]);

  const selectedResource = useMemo(
    () =>
      resources.find(
        (resource) =>
          resource._id === form.resource
      ),
    [resources, form.resource]
  );

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (name === "resource") {
      setForm((current) => ({
        ...current,
        resource: value,
        requestedQuantity: "",
      }));
    }
  };

  const openCreateForm = async () => {
    setError("");
    setSuccess("");

    if (!incidents.length || !resources.length) {
      await fetchFormData();
    }

    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError(
        "Your session has expired. Please log in again."
      );
      return;
    }

    if (!form.incident || !form.resource) {
      setError(
        "Incident and resource are required."
      );
      return;
    }

    const quantity = Number(
      form.requestedQuantity
    );

    if (!Number.isInteger(quantity) || quantity < 1) {
      setError(
        "Requested quantity must be a positive integer."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/api/resource-requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            incident: form.incident,
            resource: form.resource,
            requestedQuantity: quantity,
            reason: form.reason.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const validationMessage =
          data.errors?.[0]?.msg;

        throw new Error(
          validationMessage ||
            data.message ||
            "Unable to create resource request."
        );
      }

      setSuccess(
        "Resource request created successfully."
      );

      resetForm();
      await fetchRequests(true);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to create resource request."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell>
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                CrisisOps Allocation
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Resource Requests
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                Request and track resources
                required for verified emergency incidents.
              </p>
            </div>

            {canCreate && (
              <button
                type="button"
                onClick={openCreateForm}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                New Request
              </button>
            )}
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

          {showForm && canCreate && (
            <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    New Request
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Request Resources
                  </h2>

                  {organization && (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      Organization:{" "}
                      <span className="font-semibold">
                        {organization.name}
                      </span>
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>

              {loadingFormData ? (
                <div className="mt-6 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  Loading incidents and resources...
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="mt-6 space-y-5"
                >
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Incident
                    </label>

                    <select
                      required
                      name="incident"
                      value={form.incident}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      <option value="">
                        Select verified or active incident
                      </option>

                      {incidents.map((incident) => (
                        <option
                          key={incident._id}
                          value={incident._id}
                        >
                          {incident.title} —{" "}
                          {incident.normalizedType ||
                            incident.type}{" "}
                          — {incident.status}
                        </option>
                      ))}
                    </select>

                    {!incidents.length && (
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                        No verified or active incidents are
                        available.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Resource
                    </label>

                    <select
                      required
                      name="resource"
                      value={form.resource}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      <option value="">
                        Select resource
                      </option>

                      {resources
                        .filter(
                          (resource) =>
                            resource.status !==
                              "Inactive" &&
                            resource.availableQuantity > 0
                        )
                        .map((resource) => (
                          <option
                            key={resource._id}
                            value={resource._id}
                          >
                            {resource.name} —{" "}
                            {resource.availableQuantity}{" "}
                            {resource.unit} available
                          </option>
                        ))}
                    </select>

                    {selectedResource && (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Available:{" "}
                        <span className="font-bold">
                          {
                            selectedResource.availableQuantity
                          }{" "}
                          {selectedResource.unit}
                        </span>
                      </p>
                    )}

                    {!resources.length && (
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                        No resources are available for
                        requesting.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Requested Quantity
                    </label>

                    <input
                      required
                      min="1"
                      max={
                        selectedResource?.availableQuantity ||
                        undefined
                      }
                      step="1"
                      type="number"
                      name="requestedQuantity"
                      value={form.requestedQuantity}
                      onChange={handleChange}
                      placeholder="Enter quantity"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Reason
                    </label>

                    <textarea
                      name="reason"
                      value={form.reason}
                      onChange={handleChange}
                      rows={4}
                      maxLength={1000}
                      placeholder="Explain why the resource is required."
                      className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={
                        saving ||
                        !incidents.length ||
                        !resources.length
                      }
                      className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
                    >
                      {saving
                        ? "Submitting..."
                        : "Submit Request"}
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}

          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Search
                </label>

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search incident or resource..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
                  <option value="">
                    All statuses
                  </option>
                  <option value="Pending">
                    Pending
                  </option>
                  <option value="Partially Fulfilled">
                    Partially Fulfilled
                  </option>
                  <option value="Fulfilled">
                    Fulfilled
                  </option>
                </select>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Loading resource requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-black">
                No resource requests found
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                No requests match the current filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <article
                  key={request._id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${
                            STATUS_CLASSES[
                              request.status
                            ] ||
                            STATUS_CLASSES.Pending
                          }`}
                        >
                          {request.status}
                        </span>

                        <span className="text-xs text-slate-400">
                          {formatDate(
                            request.createdAt
                          )}
                        </span>
                      </div>

                      <h2 className="mt-3 text-xl font-black">
                        {request.resource?.name ||
                          "Resource"}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Incident:{" "}
                        <span className="font-semibold">
                          {request.incident?.title ||
                            "Unknown incident"}
                        </span>
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 px-5 py-3 dark:bg-slate-950">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Requested
                      </p>

                      <p className="mt-1 text-lg font-black">
                        {request.requestedQuantity}{" "}
                        {request.resource?.unit || ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Incident Status
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {request.incident?.status ||
                          "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Priority
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {request.incident?.priority ||
                          "—"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Requested By
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {request.requestedBy?.name ||
                          "—"}
                      </p>
                    </div>
                  </div>

                  {request.reason && (
                    <div className="mt-5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Reason
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {request.reason}
                      </p>
                    </div>
                  )}

                </article>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() =>
                fetchRequests(true)
              }
              disabled={refreshing}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default ResourceRequests;