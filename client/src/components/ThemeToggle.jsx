import { useTheme } from "../context/useTheme";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      title={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-300 bg-slate-100 text-slate-800 transition-all duration-200 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
    >
      <span
        className={`absolute text-lg transition-all duration-200 ${
          isDark
            ? "scale-100 rotate-0 opacity-100"
            : "scale-75 rotate-90 opacity-0"
        }`}
      >
        ☀
      </span>

      <span
        className={`absolute text-lg transition-all duration-200 ${
          isDark
            ? "scale-75 -rotate-90 opacity-0"
            : "scale-100 rotate-0 opacity-100"
        }`}
      >
        ☾
      </span>
    </button>
  );
}

export default ThemeToggle;