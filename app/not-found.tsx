import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-(--brand-black) px-6 py-24 text-center text-white">
      <div className="absolute inset-0 -z-10 opacity-60">
        <div className="absolute inset-x-0 top-1/4 mx-auto h-72 w-72 animate-pulse rounded-full bg-(--brand-green)/20 blur-3xl" />
        <div className="absolute inset-x-0 top-1/2 mx-auto h-80 w-80 animate-[spin_12s_linear_infinite] rounded-full border border-(--brand-accent)/30" />
        <div className="absolute left-12 top-12 h-14 w-14 animate-[float_6s_ease-in-out_infinite] rounded-full bg-(--brand-accent)/40 blur-2xl" />
        <div className="absolute bottom-16 right-10 h-20 w-20 animate-[float_8s_ease-in-out_infinite] rounded-full bg-(--brand-green)/30 blur-lg" />
      </div>

      <p className="text-sm uppercase tracking-[0.4em] text-white/70">Oops!</p>
      <h1 className="mt-4 text-5xl font-bold text-white sm:text-6xl md:text-7xl">404</h1>
      <p className="mt-6 max-w-xl text-base text-white/80 sm:text-lg">
        The page you&apos;re looking for has moved, been renamed, or never existed. Let&apos;s get you back on track.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="rounded-full bg-(--brand-green) px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-(--brand-accent)"
        >
          Back to home
        </Link>
        <Link
          href="/contact"
          className="rounded-full border border-white/30 px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:border-(--brand-accent) hover:text-(--brand-accent)"
        >
          Contact support
        </Link>
      </div>

      <div className="mt-12 flex items-center gap-3 text-left text-white/60">
        <div className="h-10 w-10 rounded-full border border-white/20 bg-black/30" />
        <p className="text-sm leading-relaxed">
          <span className="font-semibold text-white">Did you know?</span> Dambi Dollo University serves over 16,000 students
          and continues to grow every year.
        </p>
      </div>

    </div>
  );
}

