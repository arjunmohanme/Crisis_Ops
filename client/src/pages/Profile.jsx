import { useEffect, useState } from "react";
import PageShell from "../components/PageShell";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function Profile() {
  const token = localStorage.getItem("crisisops_token");
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    skills: "",
    availability: "Unavailable",
    location: {
      address: "",
      latitude: "",
      longitude: "",
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.message || "Unable to load profile."
          );
        }

        const current = data.user;
        setUser(current);
        setForm({
          name: current.name || "",
          phone: current.phone || "",
          skills: (current.skills || []).join(", "),
          availability:
            current.availability || "Unavailable",
          location: {
            address: current.location?.address || "",
            latitude: current.location?.latitude ?? "",
            longitude: current.location?.longitude ?? "",
          },
        });
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      load();
    } else {
      setLoading(false);
    }
  }, [token]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch(
        `${API_URL}/api/auth/profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone.trim() || undefined,
            skills: form.skills
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            availability: form.availability,
            location: {
              address: form.location.address.trim() || undefined,
              latitude: form.location.latitude === "" ? undefined : Number(form.location.latitude),
              longitude: form.location.longitude === "" ? undefined : Number(form.location.longitude),
            },
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.errors?.[0]?.msg ||
            data.message ||
            "Unable to update profile."
        );
      }

      setUser(data.user);
      localStorage.setItem(
        "crisisops_user",
        JSON.stringify(data.user)
      );
      setMessage("Profile updated successfully.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell>
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Account
            </p>
            <h1 className="mt-2 text-3xl font-black">
              Profile
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Update the profile information permitted by your role.
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white p-8 dark:bg-slate-900">
              Loading...
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
                  {message}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Name
                </label>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      name: event.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Email
                </label>
                <input
                  value={user?.email || ""}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 dark:border-slate-800 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Phone
                </label>
                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      phone: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Skills
                </label>
                <input
                  value={form.skills}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      skills: event.target.value,
                    })
                  }
                  placeholder="first aid, driving, logistics"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              {user?.role === "Volunteer" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Availability
                    </label>
                    <select
                      value={form.availability}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          availability:
                            event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="Available">
                        Available
                      </option>
                      <option value="Unavailable">
                        Unavailable
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Approximate Location
                    </label>
                    <input
                      value={form.location.address}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          location: {
                            ...form.location,
                            address: event.target.value,
                          },
                        })
                      }
                      placeholder="City / locality only"
                      maxLength={300}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold">
                        Latitude (optional)
                      </label>
                      <input
                        type="number"
                        min="-90"
                        max="90"
                        step="any"
                        value={form.location.latitude}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            location: {
                              ...form.location,
                              latitude: event.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold">
                        Longitude (optional)
                      </label>
                      <input
                        type="number"
                        min="-180"
                        max="180"
                        step="any"
                        value={form.location.longitude}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            location: {
                              ...form.location,
                              longitude: event.target.value,
                            },
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between border-t border-slate-200 pt-5 dark:border-slate-800">
                <span className="text-sm text-slate-500">
                  Role: {user?.role || "—"}
                </span>

                <button
                  disabled={saving}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-950"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </PageShell>
  );
}

export default Profile;
