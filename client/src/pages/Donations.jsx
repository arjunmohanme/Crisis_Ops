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

const EMPTY_FORM = {
  incident: "",
  amount: "",
  donorName: "",
  donorEmail: "",
  notes: "",
};

const getToken = () =>
  localStorage.getItem("crisisops_token");

const getStoredUser = () => {
  try {
    return JSON.parse(
      localStorage.getItem("crisisops_user") ||
        "null"
    );
  } catch {
    return null;
  }
};

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => resolve(true)
      );

      existingScript.addEventListener(
        "error",
        () => resolve(false)
      );

      return;
    }

    const script = document.createElement(
      "script"
    );

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });

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

const formatAmount = (amount) => {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return "₹0";
  }

  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const statusClasses = {
  Paid:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",

  Pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",

  Created:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",

  Failed:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300",

  Cancelled:
    "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
};

function Donations() {
  const token = getToken();

  const storedUser = useMemo(
    () => getStoredUser(),
    []
  );

  const isAdmin =
    storedUser?.role === "Admin";

  const [incidents, setIncidents] =
    useState([]);

  const [donations, setDonations] =
    useState([]);

  const [form, setForm] =
    useState({
      ...EMPTY_FORM,
      donorName:
        storedUser?.name || "",
      donorEmail:
        storedUser?.email || "",
    });

  const [loadingIncidents, setLoadingIncidents] =
    useState(true);

  const [loadingDonations, setLoadingDonations] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const fetchIncidents = useCallback(
    async () => {
      if (!token) {
        setError(
          "Authentication required."
        );
        setLoadingIncidents(false);
        return;
      }

      setLoadingIncidents(true);

      try {
        const response = await fetch(
          `${API_URL}/api/donations/eligible-incidents`,
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
              "Unable to load eligible incidents."
          );
        }

        setIncidents(
          data.incidents || []
        );
      } catch (requestError) {
        setError(
          requestError.message ||
            "Unable to load eligible incidents."
        );
      } finally {
        setLoadingIncidents(false);
      }
    },
    [token]
  );

  const fetchDonations = useCallback(
    async (refresh = false) => {
      if (!token) {
        setLoadingDonations(false);
        return;
      }

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoadingDonations(true);
      }

      try {
        const endpoint = isAdmin
          ? `${API_URL}/api/donations`
          : `${API_URL}/api/donations/mine`;

        const response = await fetch(
          endpoint,
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
              "Unable to load donations."
          );
        }

        setDonations(
          data.donations || []
        );
      } catch (requestError) {
        setError(
          requestError.message ||
            "Unable to load donations."
        );
      } finally {
        setLoadingDonations(false);
        setRefreshing(false);
      }
    },
    [token, isAdmin]
  );

  useEffect(() => {
    fetchIncidents();
    fetchDonations();
  }, [
    fetchIncidents,
    fetchDonations,
  ]);

  const paidTotal = useMemo(
    () =>
      donations
        .filter(
          (donation) =>
            donation.status === "Paid"
        )
        .reduce(
          (total, donation) =>
            total +
            Number(
              donation.amount || 0
            ),
          0
        ),
    [donations]
  );

  const pendingTotal = useMemo(
    () =>
      donations
        .filter(
          (donation) =>
            donation.status ===
              "Pending" ||
            donation.status ===
              "Created"
        )
        .reduce(
          (total, donation) =>
            total +
            Number(
              donation.amount || 0
            ),
          0
        ),
    [donations]
  );

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const verifyPayment = async ({
    donationId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  }) => {
    const response = await fetch(
      `${API_URL}/api/donations/${donationId}/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${token}`,
        },
        body: JSON.stringify({
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
        }),
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Payment verification failed."
      );
    }

    return data;
  };

  const handleDonation = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.incident) {
      setError(
        "Please select an incident."
      );
      return;
    }

    const amount = Number(
      form.amount
    );

    if (
      !Number.isFinite(amount) ||
      amount < 1
    ) {
      setError(
        "Donation amount must be at least ₹1."
      );
      return;
    }

    const razorpayLoaded =
      await loadRazorpay();

    if (!razorpayLoaded) {
      setError(
        "Razorpay Checkout could not be loaded. Check your internet connection."
      );
      return;
    }

    setSaving(true);

    try {
      const orderResponse =
        await fetch(
          `${API_URL}/api/donations`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              incident:
                form.incident,
              amount,
              donorName:
                form.donorName.trim(),
              donorEmail:
                form.donorEmail.trim(),
              notes:
                form.notes.trim(),
            }),
          }
        );

      const orderData =
        await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          orderData.message ||
            "Unable to create donation order."
        );
      }

      const donation =
        orderData.donation;

      const order =
        orderData.order;

      const options = {
        key: orderData.keyId,
        amount: order.amount,
        currency:
          order.currency,
        name: "CrisisOps",
        description:
          `Emergency donation for ${
            donation?.incident?.title ||
            "incident response"
          }`,
        order_id: order.id,

        prefill: {
          name:
            form.donorName.trim(),
          email:
            form.donorEmail.trim(),
        },

        notes: {
          incident:
            form.incident,
        },

        theme: {
          color: "#0f172a",
        },

        handler: async (
          paymentResponse
        ) => {
          try {
            setError("");

            await verifyPayment({
              donationId:
                donation._id,
              razorpayOrderId:
                paymentResponse.razorpay_order_id,
              razorpayPaymentId:
                paymentResponse.razorpay_payment_id,
              razorpaySignature:
                paymentResponse.razorpay_signature,
            });

            setSuccess(
              "Donation completed and payment verified successfully."
            );

            setForm({
              ...EMPTY_FORM,
              donorName:
                storedUser?.name ||
                "",
              donorEmail:
                storedUser?.email ||
                "",
            });

            await fetchDonations(true);
          } catch (verificationError) {
            setError(
              verificationError.message ||
                "Payment verification failed."
            );
          } finally {
            setSaving(false);
          }
        },

        modal: {
          ondismiss: () => {
            setSaving(false);

            setSuccess(
              "Payment window closed. The donation remains pending until payment is completed."
            );

            fetchDonations(true);
          },
        },
      };

      const razorpay =
        new window.Razorpay(
          options
        );

      razorpay.on(
        "payment.failed",
        (response) => {
          setSaving(false);

          setError(
            response.error
              ?.description ||
              "Razorpay payment failed."
          );

          fetchDonations(true);
        }
      );

      razorpay.open();
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to start donation."
      );
      setSaving(false);
    }
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              CrisisOps
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Emergency Donations
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Support verified and active emergency incidents
              through Razorpay Sandbox.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchIncidents();
              fetchDonations(true);
            }}
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

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
            {success}
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total Records
            </p>

            <p className="mt-2 text-3xl font-black">
              {donations.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Paid Donations
            </p>

            <p className="mt-2 text-3xl font-black">
              {formatAmount(
                paidTotal
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pending Value
            </p>

            <p className="mt-2 text-3xl font-black">
              {formatAmount(
                pendingTotal
              )}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Make a Donation
              </p>

              <h2 className="mt-2 text-xl font-black">
                Support an Emergency
              </h2>
            </div>

            {loadingIncidents ? (
              <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                Loading eligible incidents...
              </div>
            ) : incidents.length ===
              0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No verified or active incidents are
                currently available for donations.
              </div>
            ) : (
              <form
                onSubmit={handleDonation}
                className="space-y-5"
              >
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Incident
                  </label>

                  <select
                    name="incident"
                    value={form.incident}
                    onChange={handleChange}
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">
                      Select incident
                    </option>

                    {incidents.map(
                      (incident) => (
                        <option
                          key={incident._id}
                          value={
                            incident._id
                          }
                        >
                          {incident.title} —{" "}
                          {incident.status}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Amount (INR)
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="500"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Donor Name
                  </label>

                  <input
                    type="text"
                    name="donorName"
                    value={form.donorName}
                    onChange={handleChange}
                    disabled={saving}
                    maxLength={100}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Donor Email
                  </label>

                  <input
                    type="email"
                    name="donorEmail"
                    value={form.donorEmail}
                    onChange={handleChange}
                    disabled={saving}
                    maxLength={150}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    disabled={saving}
                    rows={3}
                    maxLength={500}
                    placeholder="Optional message"
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !form.incident ||
                    !form.amount
                  }
                  className="w-full rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  {saving
                    ? "Opening Razorpay..."
                    : "Donate Securely"}
                </button>

                <p className="text-center text-xs text-slate-400">
                  Razorpay Sandbox is used for this
                  academic/demo project.
                </p>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-200 p-6 dark:border-slate-800">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                {isAdmin
                  ? "All Donations"
                  : "Donation History"}
              </p>

              <h2 className="mt-2 text-xl font-black">
                {isAdmin
                  ? "Payment Records"
                  : "My Donations"}
              </h2>
            </div>

            {loadingDonations ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Loading donation history...
              </div>
            ) : donations.length ===
              0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No donation records found.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {donations.map(
                  (donation) => {
                    const statusStyle =
                      statusClasses[
                        donation.status
                      ] ||
                      statusClasses.Created;

                    return (
                      <div
                        key={donation._id}
                        className="p-6"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="font-bold">
                              {donation
                                .incident
                                ?.title ||
                                "Emergency Incident"}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              {donation
                                .incident
                                ?.normalizedType ||
                                donation
                                  .incident
                                  ?.type ||
                                "Incident"}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle}`}
                            >
                              {donation.status}
                            </span>

                            <span className="text-lg font-black">
                              {formatAmount(
                                donation.amount
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                          {isAdmin && (
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-400">
                                Donor
                              </p>

                              <p className="mt-1">
                                {donation
                                  .donorName ||
                                  donation
                                    .donor
                                    ?.name ||
                                  "Anonymous"}
                              </p>
                            </div>
                          )}

                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              Date
                            </p>

                            <p className="mt-1">
                              {formatDate(
                                donation.createdAt
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              Order ID
                            </p>

                            <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">
                              {donation.razorpayOrderId ||
                                "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              Payment ID
                            </p>

                            <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">
                              {donation.razorpayPaymentId ||
                                "Pending"}
                            </p>
                          </div>
                        </div>

                        {donation.notes && (
                          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-400">
                            {donation.notes}
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
}

export default Donations;