export default function PaymentsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={`payment-metric-${index}`} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 h-7 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={`payment-chart-${index}`} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-3 w-52 animate-pulse rounded bg-slate-100" />
            <div className="mt-4 h-70 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="h-10 w-96 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 h-85 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}
