import {
  useEffect,
  useState,
} from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import PageShell from "../components/PageShell";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const initialForm = {
  title: "",
  description: "",
  type: "",
  priority: "Medium",
  disaster: "",
  requestedResources: "",
  address: "",
  latitude: "",
  longitude: "",
  estimatedPeopleAffected: "",
};

const mapIncidentToForm = (incident) => ({
  title: incident.title || "",
  description:
    incident.description || "",
  type: incident.type || "",
  priority: incident.priority || "Medium",
  disaster:
    incident.disaster?._id ||
    incident.disaster ||
    "",
  address:
    incident.location?.address || "",
  latitude:
    incident.location?.latitude ??
    "",
  longitude:
    incident.location?.longitude ??
    "",
  estimatedPeopleAffected:
    incident.estimatedPeopleAffected ??
    "",
  requestedResources: Array.isArray(incident.requestedResources)
    ? incident.requestedResources
        .map((item) =>
          `${item.name || ""}${
            item.quantity
              ? ` (${item.quantity}${item.unit ? ` ${item.unit}` : ""})`
              : ""
          }`
        )
        .join(", ")
    : "",
});

function ReportIncident() {
  const navigate = useNavigate();

  const [searchParams] =
    useSearchParams();

  const editId =
    searchParams.get("edit");

  const isEditing =
    Boolean(editId);

  const [form, setForm] =
    useState(initialForm);

  const [disasters, setDisasters] =
    useState([]);

  const [loading, setLoading] =
    useState(isEditing);

  const [loadingDisasters, setLoadingDisasters] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const token = localStorage.getItem(
    "crisisops_token"
  );

  useEffect(() => {
    const loadPageData =
      async () => {
        if (!token) {
          setLoading(false);
          return;
        }

        setError("");

        if (isEditing) {
          setLoading(true);
        }

        setLoadingDisasters(true);

        try {
          const requests = [
            fetch(
              `${API_URL}/api/disasters`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            ),
          ];

          if (isEditing) {
            requests.push(
              fetch(
                `${API_URL}/api/incidents/mine`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                }
              )
            );
          }

          const responses =
            await Promise.all(
              requests
            );

          const disasterResponse =
            responses[0];

          const disasterData =
            await disasterResponse.json();

          if (
            disasterResponse.ok
          ) {
            setDisasters(
              disasterData.disasters ||
                []
            );
          } else {
            setDisasters([]);
          }

          if (isEditing) {
            const incidentResponse =
              responses[1];

            const incidentData =
              await incidentResponse.json();

            if (
              !incidentResponse.ok
            ) {
              throw new Error(
                incidentData.message ||
                  "Unable to load your incidents."
              );
            }

            const incident =
              (
                incidentData.incidents ||
                []
              ).find(
                (item) =>
                  item._id === editId
              );

            if (!incident) {
              throw new Error(
                "Incident not found or you do not have permission to edit it."
              );
            }

            if (
              ![
                "Reported",
                "Under Review",
              ].includes(
                incident.status
              )
            ) {
              throw new Error(
                "This incident can no longer be edited."
              );
            }

            setForm(
              mapIncidentToForm(
                incident
              )
            );
          }
        } catch (
          requestError
        ) {
          setError(
            requestError.message ||
              "Unable to load incident data."
          );
        } finally {
          setLoading(false);
          setLoadingDisasters(
            false
          );
        }
      };

    loadPageData();
  }, [
    token,
    editId,
    isEditing,
  ]);

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError(
        "Your session has expired. Please log in again."
      );
      return;
    }

    if (
      form.title.trim().length < 5
    ) {
      setError(
        "Incident title must be at least 5 characters."
      );
      return;
    }

    if (
      form.description.trim()
        .length < 10
    ) {
      setError(
        "Incident description must be at least 10 characters."
      );
      return;
    }

    if (!form.type.trim()) {
      setError(
        "Incident type is required."
      );
      return;
    }

    if (!form.address.trim()) {
      setError(
        "Location address is required."
      );
      return;
    }

    const payload = {
      title: form.title.trim(),

      description:
        form.description.trim(),

      type: form.type.trim(),
      priority: form.priority,
      requestedResources: form.requestedResources
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((name) => ({
          name,
          quantity: 1,
        })),

      location: {
        address:
          form.address.trim(),

        latitude:
          form.latitude === ""
            ? undefined
            : Number(form.latitude),

        longitude:
          form.longitude === ""
            ? undefined
            : Number(form.longitude),
      },

      estimatedPeopleAffected:
        form.estimatedPeopleAffected ===
        ""
          ? 0
          : Number(
              form.estimatedPeopleAffected
            ),

      evidence: [],
    };

    if (form.disaster) {
      payload.disaster =
        form.disaster;
    } else if (isEditing) {
      payload.disaster =
        null;
    }

    setSubmitting(true);

    try {
      const endpoint = isEditing
        ? `${API_URL}/api/incidents/${editId}`
        : `${API_URL}/api/incidents`;

      const method = isEditing
        ? "PATCH"
        : "POST";

      const response = await fetch(
        endpoint,
        {
          method,

          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify(
            payload
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        const validationMessage =
          data.errors?.[0]?.msg;

        throw new Error(
          validationMessage ||
            data.message ||
            `Failed to ${
              isEditing
                ? "update"
                : "report"
            } incident`
        );
      }

      setSuccess(
        isEditing
          ? "Incident updated successfully."
          : "Incident reported successfully."
      );

      if (!isEditing) {
        setForm(initialForm);
      }

      setTimeout(() => {
        navigate("/my-incidents");
      }, 800);
    } catch (requestError) {
      setError(
        requestError.message ||
          `Unable to ${
            isEditing
              ? "update"
              : "report"
          } incident.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Citizen Response
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {isEditing
                ? "Edit Incident Report"
                : "Report an Incident"}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
              {isEditing
                ? "Update your incident report while it is still eligible for editing."
                : "Provide accurate information about an emergency situation. Your report will be reviewed through the CrisisOps verification workflow."}
            </p>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Loading incident...
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
            >
              {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {success}
                </div>
              )}

              <div className="grid gap-6">
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Incident Title
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={
                      handleChange
                    }
                    placeholder="Example: Water entering residential area"
                    maxLength={150}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-950/40"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    {form.title.length}/150
                    characters
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Incident Type
                  </label>

                  <input
                    type="text"
                    name="type"
                    value={form.type}
                    onChange={
                      handleChange
                    }
                    placeholder="Flood, landslide, fire, accident..."
                    maxLength={100}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-950/40"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    You can describe the
                    incident naturally. CrisisOps
                    normalizes the type internally.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Related Disaster
                    <span className="ml-2 font-normal text-slate-400">
                      Optional
                    </span>
                  </label>

                  <select
                    name="disaster"
                    value={form.disaster}
                    onChange={
                      handleChange
                    }
                    disabled={
                      loadingDisasters
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="">
                      No disaster association
                    </option>

                    {disasters.map(
                      (disaster) => (
                        <option
                          key={
                            disaster._id
                          }
                          value={
                            disaster._id
                          }
                        >
                          {
                            disaster.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={form.priority}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Requested Resources
                    </label>
                    <input
                      name="requestedResources"
                      value={form.requestedResources}
                      onChange={handleChange}
                      placeholder="e.g. Water, Food kits, Blankets"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Describe what happened, the current situation, and any important details..."
                    maxLength={2000}
                    required
                    rows={6}
                    className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-950/40"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    {
                      form.description
                        .length
                    }
                    /2000 characters
                  </p>
                </div>

                <div>
                  <div className="mb-4">
                    <h2 className="text-lg font-black">
                      Incident Location
                    </h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Provide the location where
                      the incident is occurring.
                    </p>
                  </div>

                  <div className="grid gap-5">
                    <div>
                      <label className="mb-2 block text-sm font-bold">
                        Address
                      </label>

                      <textarea
                        name="address"
                        value={
                          form.address
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="House, street, locality, city..."
                        maxLength={300}
                        required
                        rows={3}
                        className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-950/40"
                      />
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-bold">
                          Latitude
                          <span className="ml-2 font-normal text-slate-400">
                            Optional
                          </span>
                        </label>

                        <input
                          type="number"
                          name="latitude"
                          value={
                            form.latitude
                          }
                          onChange={
                            handleChange
                          }
                          min="-90"
                          max="90"
                          step="any"
                          placeholder="e.g. 8.5241"
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-950/40"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-bold">
                          Longitude
                          <span className="ml-2 font-normal text-slate-400">
                            Optional
                          </span>
                        </label>

                        <input
                          type="number"
                          name="longitude"
                          value={
                            form.longitude
                          }
                          onChange={
                            handleChange
                          }
                          min="-180"
                          max="180"
                          step="any"
                          placeholder="e.g. 76.9366"
                          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-950/40"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Estimated People Affected
                  </label>

                  <input
                    type="number"
                    name="estimatedPeopleAffected"
                    value={
                      form.estimatedPeopleAffected
                    }
                    onChange={
                      handleChange
                    }
                    min="0"
                    step="1"
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-950/40"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    This is an estimate and will be
                    verified by authorized responders.
                  </p>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                  <p className="text-sm font-bold text-blue-800 dark:text-blue-300">
                    Before submitting
                  </p>

                  <p className="mt-2 text-sm leading-6 text-blue-700 dark:text-blue-400">
                    {isEditing
                      ? "Only reports in Reported or Under Review status can be edited."
                      : "Submit only accurate information. The report will initially be marked as Reported and may be reviewed or verified by authorized CrisisOps personnel."}
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/my-incidents"
                      )
                    }
                    className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      submitting
                    }
                    className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  >
                    {submitting
                      ? isEditing
                        ? "Updating..."
                        : "Submitting..."
                      : isEditing
                        ? "Update Incident"
                        : "Submit Incident"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </PageShell>
  );
}

export default ReportIncident;