import { useCallback, useEffect, useState } from "react";

import PageShell from "../components/PageShell";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const EMPTY_FORM = {
  name: "",
  description: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
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

const statusClasses = {
  Approved:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  Pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  Suspended:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",
};

function OrganizationManagement() {
  const token = getToken();

  const [organization, setOrganization] =
    useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchOrganization = useCallback(async () => {
    if (!token) {
      setError(
        "Your session has expired. Please log in again."
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
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
          data.message ||
            "Unable to load your organization profile."
        );
      }

      const profile = data.organization;

      setOrganization(profile || null);

      setForm({
        name: profile?.name || "",
        description: profile?.description || "",
        contactPerson:
          profile?.contactPerson || "",
        email: profile?.email || "",
        phone: profile?.phone || "",
        address: profile?.address || "",
      });
    } catch (requestError) {
      setOrganization(null);
      setError(
        requestError.message ||
          "Unable to load your organization profile."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const startEditing = () => {
    setError("");
    setSuccess("");
    setEditing(true);
  };

  const cancelEditing = () => {
    setError("");
    setSuccess("");

    setForm({
      name: organization?.name || "",
      description:
        organization?.description || "",
      contactPerson:
        organization?.contactPerson || "",
      email: organization?.email || "",
      phone: organization?.phone || "",
      address: organization?.address || "",
    });

    setEditing(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError(
        "Your session has expired. Please log in again."
      );
      return;
    }

    if (!organization?._id) {
      setError(
        "Organization profile was not found."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/api/organizations/${organization._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim(),
            contactPerson:
              form.contactPerson.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
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
            "Unable to update organization profile."
        );
      }

      setOrganization(data.organization);

      setForm({
        name: data.organization?.name || "",
        description:
          data.organization?.description || "",
        contactPerson:
          data.organization?.contactPerson || "",
        email: data.organization?.email || "",
        phone: data.organization?.phone || "",
        address:
          data.organization?.address || "",
      });

      setEditing(false);

      setSuccess(
        "Organization profile updated successfully."
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to update organization profile."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell>
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                CrisisOps Organization
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Organization Profile
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                Maintain your organization details used for emergency resource coordination.
              </p>
            </div>

            {!loading && organization && !editing && (
              <button
                type="button"
                onClick={startEditing}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Edit Profile
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

          {loading ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Loading organization profile...
            </section>
          ) : !organization ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-black">
                Organization profile unavailable
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                Your approved account does not currently have an organization profile linked to it.
              </p>

              <button
                type="button"
                onClick={fetchOrganization}
                className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Retry
              </button>
            </section>
          ) : editing ? (
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Organization Name
                  </span>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    minLength={2}
                    maxLength={150}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Contact Person
                  </span>

                  <input
                    name="contactPerson"
                    value={form.contactPerson}
                    onChange={handleChange}
                    required
                    minLength={2}
                    maxLength={100}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Email
                  </span>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Phone
                  </span>

                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Address
                  </span>

                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                    maxLength={300}
                    rows={3}
                    className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Description
                  </span>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    maxLength={1000}
                    rows={5}
                    className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                    placeholder="Describe the organization's emergency-response capabilities."
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-start">
                <div>
                  <h2 className="text-2xl font-black">
                    {organization.name}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Organization ID: {organization._id}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${
                    statusClasses[
                      organization.status
                    ] ||
                    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {organization.status}
                </span>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <InfoCard
                  label="Contact Person"
                  value={organization.contactPerson}
                />

                <InfoCard
                  label="Email"
                  value={organization.email}
                />

                <InfoCard
                  label="Phone"
                  value={organization.phone}
                />

                <InfoCard
                  label="Created"
                  value={formatDate(
                    organization.createdAt
                  )}
                />

                <InfoCard
                  label="Address"
                  value={organization.address}
                />

                <InfoCard
                  label="Last Updated"
                  value={formatDate(
                    organization.updatedAt
                  )}
                />
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Description
                </p>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {organization.description ||
                    "No organization description has been added yet."}
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-800 dark:text-slate-200">
        {value || "—"}
      </p>
    </div>
  );
}

export default OrganizationManagement;