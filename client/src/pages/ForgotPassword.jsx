import { useState } from "react";
import { Link } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to process request"
        );
      }

      setMessage(
        data.message ||
          "If the account exists, a password reset link has been sent."
      );
    } catch (requestError) {
      setError(
        requestError.message ||
          "Unable to process request"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] px-4 py-8 text-slate-950 dark:bg-[#050914] dark:text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="text-2xl font-black tracking-[0.18em]"
          >
            CRISISOPS
          </Link>

          <h1 className="mt-7 text-3xl font-black">
            Forgot password?
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Enter your account email and we will send
            instructions to reset your password.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">
              {message}
            </div>
          )}

          <label className="mb-2 block text-sm font-semibold">
            Email address
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="you@example.com"
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-950"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            {loading
              ? "Sending..."
              : "Send reset link"}
          </button>

          <Link
            to="/login"
            className="mt-5 block text-center text-sm font-semibold text-slate-500 hover:text-slate-950 dark:hover:text-white"
          >
            Back to login
          </Link>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;