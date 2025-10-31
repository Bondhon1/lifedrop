import Link from "next/link";

export default function Home() {
  return (
    <main className="relative z-10 flex flex-col gap-10">
  <section className="grid gap-6 rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-600/20 via-rose-950 to-[#120005] p-10 shadow-2xl shadow-rose-900/30 backdrop-blur">
        <div className="flex flex-col gap-4">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-rose-100">
            Save Lives Together
          </span>
          <h1 className="text-balance text-4xl font-semibold leading-tight text-white drop-shadow-lg sm:text-6xl">
            A modern hub for donors, requests, and community support.
          </h1>
          <p className="max-w-3xl text-pretty text-base text-rose-100/85 sm:text-lg">
            Coordinate urgent blood donations, manage donor profiles, and stay on top of real-time updates with a full-stack platform thoughtfully crafted for hospitals, community groups, and individuals.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-400"
          >
            Get Started
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 px-6 py-3 text-sm font-semibold text-rose-100 transition hover:border-rose-400/60 hover:text-white"
          >
            Sign In
          </Link>
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-rose-500/20 bg-rose-950/70 p-8 shadow-xl shadow-rose-900/30 backdrop-blur-sm sm:grid-cols-3">
        {[
          {
            title: "Proactive Monitoring",
            description: "Track every request from open to fulfilled with smart urgency indicators and donor assignment tools.",
          },
          {
            title: "Community First",
            description: "Build trust with verifiable donor cards, friend networks, and chat to coordinate faster.",
          },
          {
            title: "Admin Precision",
            description: "Moderate requests, review reports, and roll out notifications with a best-in-class dashboard.",
          },
        ].map((item) => (
          <div key={item.title} className="grid gap-2 rounded-2xl bg-rose-500/15 p-5">
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            <p className="text-sm text-rose-100/80">{item.description}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
