export default function BookingsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={`bookings-metric-${index}`} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 h-7 w-14 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="h-10 w-80 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 h-80 animate-pulse rounded bg-slate-100" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="h-8 w-56 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 h-130 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}
