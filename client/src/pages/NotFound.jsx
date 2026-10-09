import { Link } from "react-router-dom";
import PageShell from "../components/PageShell";

function NotFound() {
  return (
    <PageShell>
      <div className="flex min-h-[calc(100vh-76px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
            404
          </p>

          <h1 className="mt-4 text-3xl font-black">
            Page not found
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
            The requested CrisisOps page does not exist.
          </p>

          <Link
            to="/dashboard"
            className="mt-7 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

export default NotFound;