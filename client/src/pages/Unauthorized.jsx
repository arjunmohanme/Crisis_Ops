import { Link } from "react-router-dom";
import PageShell from "../components/PageShell";

function Unauthorized() {
  return (
    <PageShell>
      <div className="flex min-h-[calc(100vh-76px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-xl font-black text-red-600 dark:bg-red-950/40 dark:text-red-400">
            !
          </div>

          <h1 className="mt-6 text-3xl font-black">
            Access denied
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
            Your account does not have permission to
            access this module.
          </p>

          <Link
            to="/dashboard"
            className="mt-7 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

export default Unauthorized;