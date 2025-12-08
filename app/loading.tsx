export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-(--brand-black) px-6 text-center text-white">
      <div className="relative h-28 w-28">
        <div className="absolute inset-0 rounded-full border-4 border-(--brand-accent)/40" />
        <div className="absolute inset-0 animate-[spin_1.5s_linear_infinite] rounded-full border-4 border-(--brand-accent) border-t-transparent" />
        <div className="absolute inset-4 rounded-full border-4 border-(--brand-green)/30" />
        <div className="absolute inset-6 animate-[spin_2.5s_linear_infinite_reverse] rounded-full border-4 border-(--brand-green) border-b-transparent" />
      </div>
      <div className="space-y-2">
        <p className="text-lg font-semibold tracking-wide text-white">Loading DaDU content…</p>
        <p className="text-sm text-white/70">
          Gathering the latest updates and programs. Please hold on a moment.
        </p>
      </div>
    </div>
  );
}

