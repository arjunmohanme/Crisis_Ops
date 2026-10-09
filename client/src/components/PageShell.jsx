import Navbar from "./Navbar";

function PageShell({
  children,
  className = "",
}) {
  return (
    <div
      className={`min-h-screen bg-[#f7f9fc] text-slate-950 transition-colors duration-300 dark:bg-[#050914] dark:text-white ${className}`}
    >
      <Navbar />

      <main>{children}</main>
    </div>
  );
}

export default PageShell;