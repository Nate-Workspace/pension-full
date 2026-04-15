export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-96 animate-pulse rounded bg-slate-200" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={`metric-skeleton-${index}`} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 h-3 w-28 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={`chart-skeleton-${index}`} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-3 w-52 animate-pulse rounded bg-slate-100" />
            <div className="mt-4 h-70 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-4 w-56 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-64 animate-pulse rounded bg-slate-100" />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="h-5 w-44 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-4 w-52 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={`activity-skeleton-${index}`} className="h-16 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
