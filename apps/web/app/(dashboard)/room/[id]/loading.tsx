export default function RoomDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={`room-detail-metric-${index}`} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 h-7 w-20 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-56 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="h-5 w-48 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-56 animate-pulse rounded bg-slate-100" />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 h-80 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}
