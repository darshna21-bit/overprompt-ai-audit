import Link from "next/link";
export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* LOGO */}

        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-white"
        >
          Overprompt
        </Link>

       

        {/* ACTION BUTTONS */}

        <div className="flex items-center gap-3">


          <Link
            href="#audit-dashboard"
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
          >
            Run Audit
          </Link>

        </div>

      </div>
    </nav>
  );
}