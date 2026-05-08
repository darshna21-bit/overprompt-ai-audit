export default function HeroSection() {
  return (
    <section className="flex min-h-[90vh] flex-col items-center justify-center px-6 text-center">

      <div className="mb-6 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-gray-300 backdrop-blur">
        AI Spend Audit Platform
      </div>

      <h1 className="max-w-5xl text-5xl font-bold tracking-tight md:text-7xl">
        Stop Overpaying
        <span className="block text-gray-400">
          For AI Tools
        </span>
      </h1>

      <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-400">
        Overprompt analyzes your AI stack, detects overspending,
        and helps your startup optimize subscriptions, seats,
        and API usage in minutes.
      </p>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <button className="rounded-2xl bg-white px-6 py-3 font-medium text-black transition hover:opacity-90">
          Start Free Audit
        </button>

        <button className="rounded-2xl border border-white/10 px-6 py-3 font-medium text-white transition hover:bg-white/5">
          View Demo
        </button>
      </div>

      <div className="mt-16 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
        <span>Supports ChatGPT</span>
        <span>•</span>

        <span>Claude</span>
        <span>•</span>

        <span>Cursor</span>
        <span>•</span>

        <span>Gemini</span>
        <span>•</span>

        <span>GitHub Copilot</span>
      </div>

    </section>
  );
}