import Navbar from "@/components/Navbar";
export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      
      <Navbar />

      <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        
        <div className="mb-6 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-gray-300 backdrop-blur">
          AI Spend Audit Platform
        </div>

        <h1 className="max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">
          Stop Overpaying
          <span className="block text-gray-400">
            For AI Tools
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-gray-400">
          Overprompt analyzes your AI stack, detects overspending,
          and shows exactly where your startup can save money.
        </p>

        <div className="mt-10 flex gap-4">
          <button className="rounded-xl bg-white px-6 py-3 font-medium text-black transition hover:opacity-90">
            Start Free Audit
          </button>

          <button className="rounded-xl border border-white/10 px-6 py-3 font-medium text-white transition hover:bg-white/5">
            View Demo
          </button>
        </div>

      </section>
    </main>
  );
}