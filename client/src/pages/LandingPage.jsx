import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const stages = [
  {
    number: "01",
    title: "Report",
    description:
      "A citizen submits an emergency incident with location, impact and supporting information.",
  },
  {
    number: "02",
    title: "Verify",
    description:
      "Authorized reviewers validate the report before it becomes operationally authoritative.",
  },
  {
    number: "03",
    title: "Coordinate",
    description:
      "Resources and volunteers are requested, allocated and assigned.",
  },
  {
    number: "04",
    title: "Resolve",
    description:
      "Response progress is tracked until the incident reaches resolution.",
  },
];

const modules = [
  {
    tag: "01",
    title: "Incident Management",
    description:
      "Report, search, verify, prioritize and track incidents.",
    metric: "24 incidents",
    accent: "cyan",
    wide: true,
  },
  {
    tag: "02",
    title: "Resource Network",
    description:
      "Maintain organizational inventories and controlled allocation.",
    metric: "42 resources",
    accent: "blue",
  },
  {
    tag: "03",
    title: "Volunteer Response",
    description:
      "Skills, availability, field verification and assignments.",
    metric: "18 volunteers",
    accent: "emerald",
  },
  {
    tag: "04",
    title: "Audit & Accountability",
    description:
      "Trace significant operational actions across the platform.",
    metric: "Traceable",
    accent: "amber",
  },
  {
    tag: "05",
    title: "Secure Donations",
    description:
      "Sandbox Razorpay workflow connected to verified incidents.",
    metric: "Razorpay",
    accent: "violet",
  },
];

const roles = [
  {
    title: "Citizens",
    description:
      "Report incidents and follow the status of your reports.",
  },
  {
    title: "Volunteers",
    description:
      "Support field verification and active response.",
  },
  {
    title: "Organizations",
    description:
      "Provide and coordinate emergency resources.",
  },
  {
    title: "Administrators",
    description:
      "Control verification and overall operations.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f9fc] text-slate-950 dark:bg-[#050914] dark:text-white">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="landing-grid" />

          <div className="landing-light landing-light-cyan" />
          <div className="landing-light landing-light-blue" />
          <div className="landing-light landing-light-green" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pb-28 lg:pt-28">
          <div className="grid gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            {/* HERO COPY */}
            <div className="landing-hero-copy">
              <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>

                Emergency response coordination
              </div>

              <h1 className="max-w-4xl text-[54px] font-black leading-[0.94] tracking-[-0.055em] sm:text-7xl lg:text-[82px] xl:text-[94px]">
                Better information.
                <span className="block text-slate-400 dark:text-slate-500">
                  Faster coordination.
                </span>
                <span className="landing-gradient-text block">
                  Stronger response.
                </span>
              </h1>

              <p className="mt-8 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-400">
                CrisisOps is a role-based emergency response
                platform connecting incident reporting, verification,
                resources, volunteers, donations and operational
                accountability.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-slate-950 px-7 py-4 text-sm font-bold text-white shadow-xl transition duration-300 hover:-translate-y-1 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                  Get started
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white/80 px-7 py-4 text-sm font-semibold text-slate-800 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-white dark:hover:bg-slate-800"
                >
                  Sign in
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                <span className="landing-chip">
                  JWT authentication
                </span>

                <span className="landing-chip">
                  Role-based access
                </span>

                <span className="landing-chip">
                  Audit logging
                </span>

                <span className="landing-chip">
                  Razorpay Sandbox
                </span>
              </div>
            </div>

            {/* PRODUCT PREVIEW */}
            <div className="landing-product-wrap">
              <div className="product-preview">
                <div className="product-preview-header">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">
                      CrisisOps workspace
                    </p>

                    <h2 className="mt-1 text-xl font-black tracking-tight">
                      Response overview
                    </h2>
                  </div>

                  <div className="product-live">
                    <span />
                    Live
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="product-metric">
                    <span>Reported</span>
                    <strong>24</strong>
                    <small>today</small>
                  </div>

                  <div className="product-metric">
                    <span>Active</span>
                    <strong>07</strong>
                    <small>in response</small>
                  </div>

                  <div className="product-metric">
                    <span>Verified</span>
                    <strong>18</strong>
                    <small>reviewed</small>
                  </div>
                </div>

                {/* INCIDENT */}
                <div className="mt-4 product-panel">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="status-dot status-red" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500">
                          Critical incident
                        </span>
                      </div>

                      <h3 className="mt-2 text-base font-bold">
                        Flood affecting residential area
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Reported 08:42 · Under operational review
                      </p>
                    </div>

                    <span className="rounded-full bg-red-50 px-3 py-1 text-[10px] font-bold text-red-600 dark:bg-red-950/40 dark:text-red-400">
                      HIGH
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <div className="status-step status-step-active">
                      Report
                    </div>

                    <div className="status-line" />

                    <div className="status-step status-step-active">
                      Verify
                    </div>

                    <div className="status-line" />

                    <div className="status-step">
                      Allocate
                    </div>

                    <div className="status-line" />

                    <div className="status-step">
                      Resolve
                    </div>
                  </div>
                </div>

                {/* LOWER PANELS */}
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="product-panel">
                    <div className="flex items-center justify-between">
                      <span className="panel-title">
                        Resources
                      </span>

                      <span className="panel-value text-blue-500">
                        42
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="resource-row">
                        <span>Water</span>
                        <div>
                          <div className="resource-track">
                            <div className="resource-fill resource-fill-blue w-[76%]" />
                          </div>
                        </div>
                      </div>

                      <div className="resource-row">
                        <span>Medical</span>
                        <div>
                          <div className="resource-track">
                            <div className="resource-fill resource-fill-green w-[58%]" />
                          </div>
                        </div>
                      </div>

                      <div className="resource-row">
                        <span>Shelter</span>
                        <div>
                          <div className="resource-track">
                            <div className="resource-fill resource-fill-amber w-[39%]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="product-panel">
                    <div className="flex items-center justify-between">
                      <span className="panel-title">
                        Response team
                      </span>

                      <span className="panel-value text-emerald-500">
                        18
                      </span>
                    </div>

                    <div className="mt-4 flex -space-x-2">
                      <div className="team-avatar">
                        A
                      </div>

                      <div className="team-avatar bg-blue-500">
                        M
                      </div>

                      <div className="team-avatar bg-emerald-500">
                        R
                      </div>

                      <div className="team-avatar bg-amber-500">
                        S
                      </div>

                      <div className="team-more">
                        +14
                      </div>
                    </div>

                    <p className="mt-4 text-[11px] leading-5 text-slate-500">
                      Available volunteers and field verification
                      teams.
                    </p>
                  </div>
                </div>

                {/* ACTIVITY */}
                <div className="mt-4 product-panel">
                  <div className="flex items-center justify-between">
                    <span className="panel-title">
                      Recent activity
                    </span>

                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Audit
                    </span>
                  </div>

                  <div className="mt-3 space-y-3">
                    <div className="activity-row">
                      <span className="activity-dot bg-emerald-500" />
                      <p className="text-[11px]">
                        Incident verified by field verifier
                      </p>
                      <span>2m</span>
                    </div>

                    <div className="activity-row">
                      <span className="activity-dot bg-blue-500" />
                      <p className="text-[11px]">
                        Resource request approved
                      </p>
                      <span>7m</span>
                    </div>

                    <div className="activity-row">
                      <span className="activity-dot bg-amber-500" />
                      <p className="text-[11px]">
                        Volunteer assignment accepted
                      </p>
                      <span>12m</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="floating-product-note note-one">
                <span className="note-icon bg-cyan-500">
                  ✓
                </span>

                <div>
                  <p>Verified</p>
                  <small>Field information confirmed</small>
                </div>
              </div>

              <div className="floating-product-note note-two">
                <span className="note-icon bg-emerald-500">
                  +
                </span>

                <div>
                  <p>Resource allocated</p>
                  <small>Inventory updated</small>
                </div>
              </div>
            </div>
          </div>

          {/* PROJECT FLOW */}
          <div className="mt-20 rounded-3xl border border-slate-200 bg-white/75 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {stages.map((stage, index) => (
                <div
                  key={stage.number}
                  className="process-item"
                  style={{
                    animationDelay: `${index * 120}ms`,
                  }}
                >
                  <span className="process-number">
                    {stage.number}
                  </span>

                  <div>
                    <h3 className="text-base font-black tracking-tight sm:text-lg">
                      {stage.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-[15px] dark:text-slate-400">
                      {stage.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-[#08101c]">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
              Built around the actual project
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Everything needed to coordinate
              <span className="block text-slate-400 dark:text-slate-500">
                the response lifecycle.
              </span>
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-400">
              Each module represents a real CrisisOps workflow,
              rather than decorative features added only for the
              landing page.
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {modules.map((module) => (
              <div
                key={module.tag}
                className={`module-card ${
                  module.wide
                    ? "lg:col-span-2"
                    : ""
                } module-${module.accent}`}
              >
                <div className="flex items-start justify-between">
                  <span className="module-number">
                    {module.tag}
                  </span>

                  <span className="module-accent-dot" />
                </div>

                <div className="mt-12 max-w-xl">
                  <h3 className="text-2xl font-black tracking-tight">
                    {module.title}
                  </h3>

                  <p className="mt-3 max-w-lg text-[15px] leading-7 text-slate-600 dark:text-slate-400">
                    {module.description}
                  </p>
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    {module.metric}
                  </span>

                  <span className="module-arrow">
                    ↗
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
              Role-based by design
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Everyone knows
              <span className="block text-slate-400 dark:text-slate-500">
                their responsibility.
              </span>
            </h2>
          </div>

          <p className="max-w-xl text-base leading-7 text-slate-600 lg:justify-self-end dark:text-slate-400">
            Backend authorization controls what every participant
            can see and change. The frontend mirrors those
            responsibilities without treating the UI as the
            security boundary.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((role, index) => (
            <div
              key={role.title}
              className="role-card"
            >
              <span className="text-xs font-black text-slate-400">
                0{index + 1}
              </span>

              <h3 className="mt-12 text-xl font-black">
                {role.title}
              </h3>

              <p className="mt-3 text-[15px] leading-7 text-slate-600 dark:text-slate-400">
                {role.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="landing-cta">
          <div className="landing-cta-glow" />

          <div className="relative z-10 max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">
              CRISISOPS
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-6xl">
              Turn scattered information into
              <span className="block text-slate-400">
                coordinated response.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
              Report. Verify. Prioritize. Request. Allocate.
              Assign. Track. Resolve.
            </p>

            <Link
              to="/register"
              className="mt-9 inline-flex items-center gap-3 rounded-2xl bg-white px-6 py-4 text-sm font-bold text-slate-950 transition duration-300 hover:-translate-y-1 hover:bg-slate-100"
            >
              Enter CrisisOps
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-xs text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <span>
            © 2026 CrisisOps — Academic capstone
          </span>

          <span>
            Emergency Response Coordination & Verification
          </span>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;