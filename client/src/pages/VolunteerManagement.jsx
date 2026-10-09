import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import PageShell from "../components/PageShell";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const EMPTY_PROFILE = {
  name: "",
  phone: "",
  skills: "",
  availability: "Unavailable",
};

const EMPTY_FILTERS = {
  search: "",
  availability: "",
  skill: "",
  isFieldVerifier: "",
  isActive: "",
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

const statusClass = (active, blocked) => {
  if (blocked) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300";
  }

  if (!active) {
    return "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
};

function VolunteerManagement() {
  const user = getUser();
  const token = getToken();

  const isAdmin = user?.role === "Admin";
  const isVolunteer = user?.role === "Volunteer";

  const [volunteers, setVolunteers] = useState([]);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState("");

  const fetchVolunteers = useCallback(
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
        if (isVolunteer) {
          const response = await fetch(
            `${API_URL}/api/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.message || "Unable to load profile."
            );
          }

          const currentUser = data.user || data;

          setProfile({
            name: currentUser.name || "",
            phone: currentUser.phone || "",
            skills: (currentUser.skills || []).join(", "),
            availability:
              currentUser.availability || "Unavailable",
          });

          setLoading(false);
          return;
        }

        if (!isAdmin) {
          setLoading(false);
          return;
        }

        const params = new URLSearchParams();

        if (filters.search.trim()) {
          params.set("search", filters.search.trim());
        }

        if (filters.availability) {
          params.set(
            "availability",
            filters.availability
          );
        }

        if (filters.skill.trim()) {
          params.set("skills", filters.skill.trim());
        }

        if (filters.isFieldVerifier) {
          params.set(
            "isFieldVerifier",
            filters.isFieldVerifier
          );
        }

        if (filters.isActive) {
          params.set(
            "isActive",
            filters.isActive
          );
        }

        const query = params.toString();

        const response = await fetch(
          `${API_URL}/api/volunteers${
            query ? `?${query}` : ""
          }`,
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
              "Unable to load volunteers."
          );
        }

        setVolunteers(data.volunteers || []);
      } catch (requestError) {
        setError(
          requestError.message ||
            "Unable to load volunteers."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      token,
      isAdmin,
      isVolunteer,
      filters.search,
      filters.availability,
      filters.skill,
      filters.isFieldVerifier,
      filters.isActive,
    ]
  );

  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  const filteredVolunteers = useMemo(() => {
    if (!isAdmin) {
      return [];
    }

    return volunteers;
  }, [volunteers, isAdmin]);

  const activeCount = volunteers.filter(
    (volunteer) =>
      volunteer.isActive &&
      !volunteer.isBlocked
  ).length;

  const availableCount = volunteers.filter(
    (volunteer) =>
      volunteer.availability === "Available"
  ).length;

  const verifierCount = volunteers.filter(
    (volunteer) =>
      volunteer.isFieldVerifier
  ).length;

  const handleProfileChange = (event) => {
    const { name, value } = event.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();

    if (!token) {
      setError(
        "Your session has expired. Please log in again."
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const skills = profile.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    try {
      const response = await fetch(
        `${API_URL}/api/volunteers/profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: profile.name.trim(),
            phone: profile.phone.trim(),
            skills,
            availability: profile.availability,
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
            "Unable to update profile."
        );
      }

      const updated = data.volunteer;

      if (updated) {
        setProfile({
          name: updated.name || "",
          phone: updated.phone || "",
          skills: (updated.skills || []).join(", "),
          availability:
            updated.availability || "Unavailable",
        });
      }

      setSuccess(
        "Volunteer profile updated successfully."
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateVolunteer = async (
    id,
    updates
  ) => {
    if (!token) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/api/volunteers/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const validationMessage =
          data.errors?.[0]?.msg;

        throw new Error(
          validationMessage ||
            data.message ||
            "Unable to update volunteer."
        );
      }

      setSuccess(
        "Volunteer updated successfully."
      );

      await fetchVolunteers(true);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to update volunteer."
      );
    }
  };

  const toggleFieldVerifier = (volunteer) => {
    updateVolunteer(volunteer._id, {
      isFieldVerifier:
        !volunteer.isFieldVerifier,
    });
  };

  const toggleActive = (volunteer) => {
    const nextActive = !volunteer.isActive;

    updateVolunteer(volunteer._id, {
      isActive: nextActive,
      ...(nextActive
        ? {}
        : {
            availability: "Unavailable",
          }),
    });
  };

  const toggleBlocked = (volunteer) => {
    const nextBlocked = !volunteer.isBlocked;

    updateVolunteer(volunteer._id, {
      isBlocked: nextBlocked,
      ...(nextBlocked
        ? {
            availability: "Unavailable",
          }
        : {}),
    });
  };

  const editProfile = (volunteer) => {
    setEditingId(volunteer._id);

    setProfile({
      name: volunteer.name || "",
      phone: volunteer.phone || "",
      skills: (volunteer.skills || []).join(", "),
      availability:
        volunteer.availability || "Unavailable",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const saveAdminVolunteer = async (event) => {
    event.preventDefault();

    if (!editingId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/api/volunteers/${editingId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            availability:
              profile.availability,
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
            "Unable to update volunteer."
        );
      }

      setSuccess(
        "Volunteer availability updated."
      );

      setEditingId("");

      await fetchVolunteers(true);
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to update volunteer."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell>
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              CrisisOps Coordination
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Volunteers
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
              Manage volunteer availability,
              skills and field-verification
              capability.
            </p>
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

          {isVolunteer && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  My Profile
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Volunteer Profile
                </h2>
              </div>

              <form
                onSubmit={saveProfile}
                className="space-y-5"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Name
                    </label>

                    <input
                      required
                      name="name"
                      value={profile.name}
                      onChange={
                        handleProfileChange
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Phone
                    </label>

                    <input
                      name="phone"
                      value={profile.phone}
                      onChange={
                        handleProfileChange
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Skills
                  </label>

                  <input
                    name="skills"
                    value={profile.skills}
                    onChange={
                      handleProfileChange
                    }
                    placeholder="First Aid, Search and Rescue, Driving"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    Separate skills with commas.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Availability
                  </label>

                  <select
                    name="availability"
                    value={
                      profile.availability
                    }
                    onChange={
                      handleProfileChange
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="Available">
                      Available
                    </option>

                    <option value="Unavailable">
                      Unavailable
                    </option>
                  </select>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950"
                  >
                    {saving
                      ? "Saving..."
                      : "Save Profile"}
                  </button>
                </div>
              </form>
            </section>
          )}

          {isAdmin && (
            <>
              <section className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Total
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    {volunteers.length}
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
                    Available
                  </p>

                  <p className="mt-2 text-3xl font-black text-blue-600 dark:text-blue-400">
                    {availableCount}
                  </p>
                </div>
              </section>

              <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <input
                    value={filters.search}
                    onChange={(event) =>
                      setFilters(
                        (current) => ({
                          ...current,
                          search:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="Search volunteer..."
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                  />

                  <select
                    value={
                      filters.availability
                    }
                    onChange={(event) =>
                      setFilters(
                        (current) => ({
                          ...current,
                          availability:
                            event.target.value,
                        })
                      )
                    }
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">
                      All availability
                    </option>

                    <option value="Available">
                      Available
                    </option>

                    <option value="Unavailable">
                      Unavailable
                    </option>
                  </select>

                  <input
                    value={filters.skill}
                    onChange={(event) =>
                      setFilters(
                        (current) => ({
                          ...current,
                          skill:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="Skill..."
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                  />

                  <select
                    value={
                      filters.isFieldVerifier
                    }
                    onChange={(event) =>
                      setFilters(
                        (current) => ({
                          ...current,
                          isFieldVerifier:
                            event.target.value,
                        })
                      )
                    }
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">
                      All verifier status
                    </option>

                    <option value="true">
                      Field Verifier
                    </option>

                    <option value="false">
                      Standard Volunteer
                    </option>
                  </select>

                  <select
                    value={filters.isActive}
                    onChange={(event) =>
                      setFilters(
                        (current) => ({
                          ...current,
                          isActive:
                            event.target.value,
                        })
                      )
                    }
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">
                      All accounts
                    </option>

                    <option value="true">
                      Active
                    </option>

                    <option value="false">
                      Inactive
                    </option>
                  </select>
                </div>
              </section>

              {editingId && (
                <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Volunteer
                      </p>

                      <h2 className="mt-1 text-xl font-black">
                        Edit Availability
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingId("")
                      }
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm dark:border-slate-700"
                    >
                      Cancel
                    </button>
                  </div>

                  <form
                    onSubmit={
                      saveAdminVolunteer
                    }
                    className="flex flex-col gap-4 sm:flex-row sm:items-end"
                  >
                    <div className="flex-1">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Availability
                      </label>

                      <select
                        value={
                          profile.availability
                        }
                        onChange={(event) =>
                          setProfile(
                            (current) => ({
                              ...current,
                              availability:
                                event.target
                                  .value,
                            })
                          )
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                      >
                        <option value="Available">
                          Available
                        </option>

                        <option value="Unavailable">
                          Unavailable
                        </option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950"
                    >
                      {saving
                        ? "Saving..."
                        : "Save"}
                    </button>
                  </form>
                </section>
              )}

              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                  Loading volunteers...
                </div>
              ) : filteredVolunteers.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="text-xl font-black">
                    No volunteers found
                  </h2>

                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Try changing the filters.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {filteredVolunteers.map(
                    (volunteer) => (
                      <article
                        key={volunteer._id}
                        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(
                                  volunteer.isActive,
                                  volunteer.isBlocked
                                )}`}
                              >
                                {volunteer.isBlocked
                                  ? "Blocked"
                                  : volunteer.isActive
                                    ? "Active"
                                    : "Inactive"}
                              </span>

                              {volunteer.isFieldVerifier && (
                                <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
                                  Field Verifier
                                </span>
                              )}
                            </div>

                            <h2 className="mt-3 text-xl font-black">
                              {volunteer.name}
                            </h2>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              {volunteer.email}
                            </p>
                          </div>

                          <p className="text-xs text-slate-400">
                            {formatDate(
                              volunteer.createdAt
                            )}
                          </p>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              Availability
                            </p>

                            <p className="mt-1 text-sm font-semibold">
                              {
                                volunteer.availability
                              }
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              Phone
                            </p>

                            <p className="mt-1 text-sm font-semibold">
                              {volunteer.phone ||
                                "—"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Skills
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {volunteer.skills?.length ? (
                              volunteer.skills.map(
                                (skill) => (
                                  <span
                                    key={skill}
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-800 dark:bg-slate-950"
                                  >
                                    {skill}
                                  </span>
                                )
                              )
                            ) : (
                              <span className="text-sm text-slate-400">
                                No skills listed
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-5 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() =>
                              editProfile(
                                volunteer
                              )
                            }
                            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold dark:border-slate-700"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleFieldVerifier(
                                volunteer
                              )
                            }
                            className="rounded-xl border border-purple-200 px-4 py-2.5 text-sm font-semibold text-purple-700 dark:border-purple-900 dark:text-purple-300"
                          >
                            {volunteer.isFieldVerifier
                              ? "Remove Verifier"
                              : "Make Verifier"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleActive(
                                volunteer
                              )
                            }
                            className="rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 dark:border-blue-900 dark:text-blue-300"
                          >
                            {volunteer.isActive
                              ? "Deactivate"
                              : "Activate"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              toggleBlocked(
                                volunteer
                              )
                            }
                            className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 dark:border-red-900 dark:text-red-400"
                          >
                            {volunteer.isBlocked
                              ? "Unblock"
                              : "Block"}
                          </button>
                        </div>
                      </article>
                    )
                  )}
                </div>
              )}
            </>
          )}

          {!isAdmin && !isVolunteer && (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-black">
                Volunteer access required
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                This page is available to Admin and
                Volunteer accounts.
              </p>
            </div>
          )}

          {(isAdmin || isVolunteer) && (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  fetchVolunteers(true)
                }
                disabled={refreshing}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </button>
            </div>
          )}

          {isAdmin && (
            <div className="mt-4 text-right text-xs text-slate-400">
              Field verifiers: {verifierCount}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

export default VolunteerManagement;