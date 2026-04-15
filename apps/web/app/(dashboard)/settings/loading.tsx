export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={`settings-a-${index}`} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="h-4 w-44 animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-3 w-64 animate-pulse rounded bg-slate-100" />
            <div className="mt-4 h-65 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="h-4 w-44 animate-pulse rounded bg-slate-100" />
        <div className="mt-2 h-3 w-64 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 h-55 animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}
