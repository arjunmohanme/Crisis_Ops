import { useCallback, useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const EMPTY_FORM = {
  resourceRequest: "",
  allocatedQuantity: "",
  notes: "",
};

const STATUS_CLASSES = {
  Allocated:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  Fulfilled:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  Cancelled:
    "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
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

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    dateStyle: "medium",
  });
};

function Allocations() {
  const user = getUser();
  const token = getToken();

  const isAdmin = user?.role === "Admin";
  const isOrganization = user?.role === "Organization";
  const canAllocate = isAdmin || isOrganization;

  const [allocations, setAllocations] = useState([]);
  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] =
    useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchAllocations = useCallback(
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
          ? `${API_URL}/api/allocations`
          : `${API_URL}/api/allocations/mine`;

        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load allocations."
          );
        }

        setAllocations(data.allocations || []);
      } catch (requestError) {
        setError(
          requestError.message ||
            "Unable to load allocations."
        );
        setAllocations([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, isAdmin]
  );

  const fetchAvailableRequests =
    useCallback(async () => {
      if (!token || !canAllocate) return;

      setLoadingRequests(true);

      try {
        const endpoint = isAdmin
          ? `${API_URL}/api/resource-requests`
          : `${API_URL}/api/resource-requests`;

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

        const availableRequests = (
          data.resourceRequests || []
        ).filter(
          (request) =>
            ["Pending", "Partially Fulfilled"].includes(request.status) &&
            Number(
              request.remainingQuantity ??
              (
                request.requestedQuantity -
                (request.fulfilledQuantity || 0)
              )
            ) > 0
        );

        setRequests(availableRequests);
      } catch (requestError) {
        setError(
          requestError.message ||
            "Unable to load available requests."
        );
        setRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    }, [token, canAllocate, isAdmin]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  useEffect(() => {
    fetchAvailableRequests();
  }, [fetchAvailableRequests]);

  const filteredAllocations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allocations.filter((allocation) => {
      const matchesStatus =
        !statusFilter ||
        allocation.status === statusFilter;

      const matchesSearch =
        !query ||
        allocation.resource?.name
          ?.toLowerCase()
          .includes(query) ||
        allocation.resource?.category
          ?.toLowerCase()
          .includes(query) ||
        allocation.incident?.title
          ?.toLowerCase()
          .includes(query) ||
        allocation.allocatedBy?.name
          ?.toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [allocations, search, statusFilter]);

  const selectedRequest = useMemo(
    () =>
      requests.find(
        (request) =>
          request._id === form.resourceRequest
      ),
    [requests, form.resourceRequest]
  );

  const allocatedCount = allocations.filter(
    (allocation) =>
      allocation.status === "Allocated"
  ).length;

  const fulfilledCount = allocations.filter(
    (allocation) =>
      allocation.status === "Fulfilled"
  ).length;

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const openCreateForm = async () => {
    setError("");
    setSuccess("");

    await fetchAvailableRequests();

    setShowForm(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (name === "resourceRequest") {
      const request = requests.find(
        (item) => item._id === value
      );

      setForm((current) => ({
        ...current,
        resourceRequest: value,
        allocatedQuantity:
          request
            ? Math.max(
                0,
                request.remainingQuantity ??
                  (
                    request.requestedQuantity -
                    (request.fulfilledQuantity || 0)
                  )
              )
            : "",
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError(
        "Your session has expired. Please log in again."
      );
      return;
    }

    const quantity = Number(
      form.allocatedQuantity
    );

    if (!form.resourceRequest) {
      setError(
        "Please select a pending or partially fulfilled resource request."
      );
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      setError(
        "Allocated quantity must be a positive integer."
      );
      return;
    }

    const remainingQuantity = selectedRequest
      ? Number(
          selectedRequest.remainingQuantity ??
            (
              selectedRequest.requestedQuantity -
              (selectedRequest.fulfilledQuantity || 0)
            )
        )
      : 0;

    if (
      selectedRequest &&
      quantity > remainingQuantity
    ) {
      setError(
        `Allocated quantity cannot exceed the remaining requested quantity (${remainingQuantity}).`
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/api/allocations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            resourceRequest:
              form.resourceRequest,
            allocatedQuantity: quantity,
            notes: form.notes.trim(),
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
            "Unable to create allocation."
        );
      }

      setSuccess(
        "Resource allocated successfully."
      );

      resetForm();

      await Promise.all([
        fetchAllocations(true),
        fetchAvailableRequests(),
      ]);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to create allocation."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAllocationAction = async (
    allocationId,
    action,
    message
  ) => {
    if (!window.confirm(message)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/api/allocations/${allocationId}/${action}`,
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
            `Unable to ${action} allocation.`
        );
      }

      setSuccess(
        action === "fulfill"
          ? "Allocation fulfilled successfully."
          : "Allocation cancelled successfully."
      );

      await fetchAllocations(true);
    } catch (requestError) {
      setError(
        requestError.message ||
          `Unable to ${action} allocation.`
      );
    }
  };

  return (
    <PageShell>
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                CrisisOps Fulfillment
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Allocations
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                Allocate approved resources and track
                fulfillment status.
              </p>
            </div>

            {canAllocate && (
              <button
                type="button"
                onClick={openCreateForm}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                New Allocation
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

          {showForm && canAllocate && (
            <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Available Requests
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    Allocate Resource
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

              {loadingRequests ? (
                <div className="mt-6 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  Loading approved requests...
                </div>
              ) : requests.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No approved resource requests are
                    currently available.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="mt-6 space-y-5"
                >
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Available Request
                    </label>

                    <select
                      required
                      name="resourceRequest"
                      value={form.resourceRequest}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      <option value="">
                        Select approved request
                      </option>

                      {requests.map((request) => (
                        <option
                          key={request._id}
                          value={request._id}
                        >
                          {request.resource?.name ||
                            "Resource"}{" "}
                          —{" "}
                          {request.requestedQuantity}{" "}
                          {request.resource?.unit ||
                            ""}{" "}
                          —{" "}
                          {request.incident?.title ||
                            "Incident"}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedRequest && (
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Resource
                        </p>

                        <p className="mt-1 text-sm font-bold">
                          {selectedRequest.resource
                            ?.name || "—"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Requested
                        </p>

                        <p className="mt-1 text-sm font-bold">
                          {
                            selectedRequest.requestedQuantity
                          }{" "}
                          {selectedRequest.resource
                            ?.unit || ""}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Incident
                        </p>

                        <p className="mt-1 text-sm font-bold">
                          {selectedRequest.incident
                            ?.title || "—"}
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Allocated Quantity
                    </label>

                    <input
                      required
                      min="1"
                      step="1"
                      type="number"
                      name="allocatedQuantity"
                      value={form.allocatedQuantity}
                      onChange={handleChange}
                      placeholder="Allocated quantity"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />

                    <p className="mt-2 text-xs text-slate-400">
                      The backend validates the approved
                      quantity and current inventory.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Notes
                    </label>

                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      rows={3}
                      maxLength={500}
                      placeholder="Optional allocation notes."
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
                      disabled={saving}
                      className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950"
                    >
                      {saving
                        ? "Allocating..."
                        : "Allocate Resource"}
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}

          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Total
              </p>

              <p className="mt-2 text-3xl font-black">
                {allocations.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Allocated
              </p>

              <p className="mt-2 text-3xl font-black text-blue-600 dark:text-blue-400">
                {allocatedCount}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Fulfilled
              </p>

              <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {fulfilledCount}
              </p>
            </div>
          </section>

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
                  placeholder="Search resource or incident..."
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
                  <option value="Allocated">
                    Allocated
                  </option>
                  <option value="Fulfilled">
                    Fulfilled
                  </option>
                  <option value="Cancelled">
                    Cancelled
                  </option>
                </select>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Loading allocations...
            </div>
          ) : filteredAllocations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-black">
                No allocations found
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                No allocation records match the current
                filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAllocations.map(
                (allocation) => (
                  <article
                    key={allocation._id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${
                              STATUS_CLASSES[
                                allocation.status
                              ] ||
                              STATUS_CLASSES.Cancelled
                            }`}
                          >
                            {allocation.status}
                          </span>

                          <span className="text-xs text-slate-400">
                            {formatDate(
                              allocation.createdAt
                            )}
                          </span>
                        </div>

                        <h2 className="mt-3 text-xl font-black">
                          {allocation.resource?.name ||
                            "Resource"}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Incident:{" "}
                          <span className="font-semibold">
                            {allocation.incident
                              ?.title || "—"}
                          </span>
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 px-5 py-3 dark:bg-slate-950">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Allocated
                        </p>

                        <p className="mt-1 text-lg font-black">
                          {
                            allocation.allocatedQuantity
                          }{" "}
                          {allocation.resource?.unit ||
                            ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Priority
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {allocation.incident
                            ?.priority || "—"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Allocated By
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {allocation.allocatedBy
                            ?.name || "—"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Created
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {formatDate(
                            allocation.createdAt
                          )}
                        </p>
                      </div>
                    </div>

                    {allocation.notes && (
                      <div className="mt-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Notes
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                          {allocation.notes}
                        </p>
                      </div>
                    )}

                    {isAdmin &&
                      allocation.status ===
                        "Allocated" && (
                        <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() =>
                              handleAllocationAction(
                                allocation._id,
                                "cancel",
                                "Cancel this allocation?"
                              )
                            }
                            className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleAllocationAction(
                                allocation._id,
                                "fulfill",
                                "Mark this allocation as fulfilled?"
                              )
                            }
                            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
                          >
                            Fulfill
                          </button>
                        </div>
                      )}
                  </article>
                )
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() =>
                fetchAllocations(true)
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

export default Allocations;