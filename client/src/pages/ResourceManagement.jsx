import { useCallback, useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const EMPTY_FORM = {
  organizationId: "",
  name: "",
  category: "",
  description: "",
  unit: "",
  totalQuantity: "",
};

const STATUS_CLASSES = {
  Available:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  "Low Stock":
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  "Out of Stock":
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
  Inactive:
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

function ResourceManagement() {
  const user = getUser();
  const token = getToken();

  const isAdmin = user?.role === "Admin";
  const isOrganization = user?.role === "Organization";
  const canManage = isAdmin || isOrganization;

  const [resources, setResources] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [organization, setOrganization] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchOrganizationData = useCallback(async () => {
    if (!token || !canManage) return;

    try {
      if (isAdmin) {
        const response = await fetch(
          `${API_URL}/api/organizations`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load organizations."
          );
        }

        setOrganizations(
          (data.organizations || []).filter(
            (item) => item.status === "Approved"
          )
        );

        return;
      }

      const response = await fetch(
        `${API_URL}/api/organizations/mine`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load your organization."
        );
      }

      setOrganization(data.organization || null);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to load organization details."
      );
    }
  }, [token, canManage, isAdmin]);

  const fetchResources = useCallback(
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
        let url = "";

        if (isOrganization) {
          if (!organization?._id) {
            setResources([]);
            return;
          }

          url = `${API_URL}/api/resources/organization/${organization._id}`;
        } else {
          const params = new URLSearchParams();

          if (search.trim()) {
            params.set("search", search.trim());
          }

          if (category.trim()) {
            params.set("category", category.trim());
          }

          if (statusFilter) {
            params.set("status", statusFilter);
          }

          params.set("page", "1");
          params.set("limit", "100");

          url = `${API_URL}/api/resources?${params.toString()}`;
        }

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load resources."
          );
        }

        setResources(data.resources || []);
      } catch (requestError) {
        setError(
          requestError.message ||
            "Unable to load resources."
        );
        setResources([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      token,
      isOrganization,
      organization?._id,
      search,
      category,
      statusFilter,
    ]
  );

  useEffect(() => {
    fetchOrganizationData();
  }, [fetchOrganizationData]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const visibleResources = useMemo(() => {
    if (!isOrganization) {
      return resources;
    }

    const query = search.trim().toLowerCase();

    return resources.filter((resource) => {
      const matchesSearch =
        !query ||
        resource.name?.toLowerCase().includes(query) ||
        resource.category?.toLowerCase().includes(query) ||
        resource.description?.toLowerCase().includes(query) ||
        resource.unit?.toLowerCase().includes(query);

      const matchesCategory =
        !category.trim() ||
        resource.category
          ?.toLowerCase()
          .includes(category.trim().toLowerCase());

      const matchesStatus =
        !statusFilter ||
        resource.status === statusFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    resources,
    isOrganization,
    search,
    category,
    statusFilter,
  ]);

  const activeCount = visibleResources.filter(
    (resource) => resource.status === "Available"
  ).length;

  const lowCount = visibleResources.filter(
    (resource) => resource.status === "Low Stock"
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

    setForm({
      ...EMPTY_FORM,
      organizationId: isOrganization
        ? organization?._id || ""
        : "",
    });

    setShowForm(true);
  };

  const openEditForm = (resource) => {
    setError("");
    setSuccess("");
    setEditingId(resource._id);

    setForm({
      organizationId:
        resource.organization?._id ||
        resource.organization ||
        "",
      name: resource.name || "",
      category: resource.category || "",
      description: resource.description || "",
      unit: resource.unit || "",
      totalQuantity:
        resource.totalQuantity ?? "",
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
      setError(
        "Your session has expired. Please log in again."
      );
      return;
    }

    if (!form.organizationId && !editingId) {
      setError("Please select an organization.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const editing = Boolean(editingId);

      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        unit: form.unit.trim(),
        totalQuantity: Number(form.totalQuantity),
      };

      if (!editing) {
        payload.organizationId = form.organizationId;
      }

      const response = await fetch(
        editing
          ? `${API_URL}/api/resources/${editingId}`
          : `${API_URL}/api/resources`,
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
        const validationMessage =
          data.errors?.[0]?.msg;

        throw new Error(
          validationMessage ||
            data.message ||
            "Unable to save resource."
        );
      }

      setSuccess(
        editing
          ? "Resource updated successfully."
          : "Resource created successfully."
      );

      resetForm();
      await fetchResources(true);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to save resource."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (resource) => {
    if (
      !window.confirm(
        `Delete "${resource.name}"? This is allowed only when the resource has no request or allocation history.`
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/api/resources/${resource._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to delete resource."
        );
      }

      setSuccess("Resource deleted successfully.");
      await fetchResources(true);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to delete resource."
      );
    }
  };

  const handleDeactivate = async (resource) => {
    if (
      !window.confirm(
        `Deactivate "${resource.name}"?`
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/api/resources/${resource._id}/deactivate`,
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
            "Unable to deactivate resource."
        );
      }

      setSuccess(
        "Resource deactivated successfully."
      );

      await fetchResources(true);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to deactivate resource."
      );
    }
  };

  return (
    <PageShell>
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                CrisisOps Response
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Resources
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                Manage emergency inventory and resource
                availability.
              </p>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={openCreateForm}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Add Resource
              </button>
            )}
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

          {showForm && canManage && (
            <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    {editingId ? "Update" : "Create"}
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    {editingId
                      ? "Edit Resource"
                      : "Add Resource"}
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

              <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-5"
              >
                {!editingId && isAdmin && (
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Organization
                    </label>

                    <select
                      required
                      name="organizationId"
                      value={form.organizationId}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      <option value="">
                        Select organization
                      </option>

                      {organizations.map((item) => (
                        <option
                          key={item._id}
                          value={item._id}
                        >
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {isOrganization && organization && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                    <span className="font-semibold">
                      Organization:
                    </span>{" "}
                    {organization.name}
                  </div>
                )}

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Resource Name
                    </label>

                    <input
                      required
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Emergency water bottles"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Category
                    </label>

                    <input
                      required
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      placeholder="Water, Medical, Food..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Unit
                    </label>

                    <input
                      required
                      name="unit"
                      value={form.unit}
                      onChange={handleChange}
                      placeholder="boxes, litres, kits..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Total Quantity
                    </label>

                    <input
                      required
                      min="0"
                      step="0.01"
                      type="number"
                      name="totalQuantity"
                      value={form.totalQuantity}
                      onChange={handleChange}
                      placeholder="100"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
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
                    maxLength={500}
                    placeholder="Describe the resource."
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
                    className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Update Resource"
                        : "Create Resource"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Search
                </label>

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search resources..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Category
                </label>

                <input
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  placeholder="Medical, food, shelter..."
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
                  <option value="Available">
                    Available
                  </option>
                  <option value="Low Stock">
                    Low Stock
                  </option>
                  <option value="Out of Stock">
                    Out of Stock
                  </option>
                  <option value="Inactive">
                    Inactive
                  </option>
                </select>
              </div>
            </div>
          </section>

          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Total Resources
              </p>

              <p className="mt-2 text-3xl font-black">
                {visibleResources.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Available
              </p>

              <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {activeCount}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Low Stock
              </p>

              <p className="mt-2 text-3xl font-black text-amber-600 dark:text-amber-400">
                {lowCount}
              </p>
            </div>
          </section>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Loading resources...
            </div>
          ) : visibleResources.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-black">
                No resources found
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                No resources match the current filters.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleResources.map((resource) => (
                <article
                  key={resource._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        {resource.category}
                      </p>

                      <h2 className="mt-2 text-xl font-black">
                        {resource.name}
                      </h2>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
                        STATUS_CLASSES[
                          resource.status
                        ] ||
                        STATUS_CLASSES.Inactive
                      }`}
                    >
                      {resource.status}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Total
                      </p>

                      <p className="mt-1 text-xl font-black">
                        {resource.totalQuantity ?? 0}{" "}
                        {resource.unit}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Available
                      </p>

                      <p className="mt-1 text-xl font-black">
                        {resource.availableQuantity ?? 0}{" "}
                        {resource.unit}
                      </p>
                    </div>
                  </div>

                  {resource.description && (
                    <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {resource.description}
                    </p>
                  )}

                  <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Organization
                    </p>

                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {resource.organization?.name ||
                        "—"}
                    </p>

                    <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Created
                    </p>

                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {formatDate(resource.createdAt)}
                    </p>
                  </div>

                  {canManage &&
                    resource.status !== "Inactive" && (
                      <div className="mt-5 flex gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(resource)
                          }
                          className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(resource)
                          }
                          className="flex-1 rounded-xl border border-red-300 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                          Delete
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeactivate(resource)
                          }
                          className="flex-1 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                          Deactivate
                        </button>
                      </div>
                    )}
                </article>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => fetchResources(true)}
              disabled={refreshing}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default ResourceManagement;