import { useEffect } from "react";
import { useTheme } from "../context/useTheme";

function LoadingScreen({ onComplete }) {
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const isDark = theme === "dark";

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden transition-colors duration-300 ${
        isDark
          ? "bg-[#050914] text-white"
          : "bg-[#f7f9fc] text-slate-950"
      }`}
    >
      <div
        className={`absolute inset-0 loading-background-grid ${
          isDark
            ? "opacity-50"
            : "opacity-30"
        }`}
      />

      <div
        className={`loading-glow loading-glow-one ${
          isDark
            ? "opacity-100"
            : "opacity-50"
        }`}
      />

      <div className="loading-glow loading-glow-two" />

      <div className="relative flex flex-col items-center">
        <div className="relative flex h-32 w-32 items-center justify-center">
          <div
            className={`loading-orbit loading-orbit-one ${
              isDark
                ? "border-cyan-400/30"
                : "border-cyan-600/20"
            }`}
          />

          <div
            className={`loading-orbit loading-orbit-two ${
              isDark
                ? "border-blue-400/20"
                : "border-blue-600/15"
            }`}
          />

          <div
            className={`loading-orbit loading-orbit-three ${
              isDark
                ? "border-emerald-400/15"
                : "border-emerald-600/15"
            }`}
          />

          <div
            className={`loading-logo ${
              isDark
                ? "bg-[#0d1726] text-white"
                : "bg-white text-slate-950"
            }`}
          >
            C
          </div>
        </div>

        <div className="mt-8 text-center loading-brand">
          <h1
            className={`loading-wordmark ${
              isDark
                ? "text-white"
                : "text-slate-950"
            }`}
          >
            CRISISOPS
          </h1>

          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.42em] text-slate-500">
            Emergency Response Coordination
          </p>
        </div>

        <div className="mt-12 w-64">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              Initializing
            </span>

            <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400">
              ONLINE
            </span>
          </div>

          <div
            className={`h-[3px] overflow-hidden rounded-full ${
              isDark
                ? "bg-slate-800"
                : "bg-slate-200"
            }`}
          >
            <div className="loading-bar h-full rounded-full" />
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <span className="loading-status-dot" />
          <span className="loading-status-dot loading-status-delay-one" />
          <span className="loading-status-dot loading-status-delay-two" />
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;