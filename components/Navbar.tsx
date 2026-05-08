export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        <div className="text-xl font-semibold tracking-tight text-white">
          Overprompt
        </div>

        <div className="hidden items-center gap-8 text-sm text-gray-300 md:flex">
          <a
            href="#features"
            className="transition hover:text-white"
          >
            Features
          </a>

          <a
            href="#pricing"
            className="transition hover:text-white"
          >
            Pricing
          </a>

          <a
            href="#about"
            className="transition hover:text-white"
          >
            About
          </a>
        </div>

        <button className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:opacity-90">
          Start Audit
        </button>

      </div>
    </nav>
  );
}