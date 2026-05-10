export default function HeroSection() {
  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 text-center">

      {/* BACKGROUND GLOW */}

      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.12),transparent_35%)]" />

      {/* TAG */}

      <div className="mb-6 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-gray-300 backdrop-blur">
        AI Spend Audit Platform
      </div>

      {/* HEADING */}

      <h1 className="max-w-5xl text-5xl font-bold tracking-tight md:text-7xl">

        Stop Overpaying

        <span className="block bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
          For AI Tools
        </span>

      </h1>

      {/* SUBTEXT */}

      <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-400">

        Overprompt analyzes your AI stack, identifies
        unnecessary enterprise spending, and helps your
        startup optimize subscriptions, seats, and AI
        infrastructure costs in minutes.

      </p>


      {/* SUPPORTED TOOLS */}

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