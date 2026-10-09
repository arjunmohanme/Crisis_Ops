import {
  Link,
  useNavigate,
  useNavigationType,
} from "react-router-dom";

import ThemeToggle from "./ThemeToggle";

function Navbar() {
  const navigate = useNavigate();
  const navigationType = useNavigationType();

  const token = localStorage.getItem(
    "crisisops_token"
  );

  const showBackButton =
    Boolean(token) &&
    navigationType === "PUSH";

  const handleBack = () => {
    navigate(-1);
  };

  const logout = () => {
    localStorage.removeItem(
      "crisisops_token"
    );

    localStorage.removeItem(
      "crisisops_user"
    );

    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#f7f9fc]/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#050914]/80">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {showBackButton && (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              title="Go back"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              ←
            </button>
          )}

          <Link
            to="/"
            className="group flex min-w-0 items-center gap-3"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-lg font-black tracking-tight text-white shadow-sm transition duration-300 group-hover:scale-105 group-hover:shadow-lg dark:bg-white dark:text-slate-950">
              C
            </div>

            <div className="min-w-0">
              <p className="truncate font-black text-[19px] leading-none tracking-[0.17em] [font-family:'Inter_Tight',sans-serif] dark:text-white">
                CRISISOPS
              </p>

              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 [font-family:'Inter_Tight',sans-serif] dark:text-slate-400">
                Emergency Response
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {token ? (
            <>
              <Link
                to="/profile"
                className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-200/70 sm:block dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Profile
              </Link>

              <Link
                to="/dashboard"
                className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-200/70 sm:block dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Dashboard
              </Link>

              <button
                type="button"
                onClick={logout}
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-200/70 sm:block dark:text-slate-300 dark:hover:bg-slate-900"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;