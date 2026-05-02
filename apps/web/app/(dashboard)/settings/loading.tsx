export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <section>
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-96 max-w-full animate-pulse rounded bg-slate-100" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-4 w-44 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-3 w-64 animate-pulse rounded bg-slate-100" />

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="h-10 sm:col-span-2 animate-pulse rounded-md bg-slate-100" />
            <div className="h-10 animate-pulse rounded-md bg-slate-100" />
            <div className="h-10 animate-pulse rounded-md bg-slate-100" />
            <div className="h-10 sm:col-span-2 animate-pulse rounded-md bg-slate-100" />
            <div className="h-10 sm:col-span-2 animate-pulse rounded-md bg-slate-100" />
            <div className="h-10 sm:col-span-2 animate-pulse rounded-md bg-slate-100" />
          </div>

          <div className="mt-4 flex justify-end">
            <div className="h-10 w-32 animate-pulse rounded-md bg-slate-100" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="h-4 w-44 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-3 w-56 animate-pulse rounded bg-slate-100" />

          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
              <div className="h-10 animate-pulse rounded-md bg-slate-100" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
              <div className="h-10 animate-pulse rounded-md bg-slate-100" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
              <div className="h-10 animate-pulse rounded-md bg-slate-100" />
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="h-10 w-32 animate-pulse rounded-md bg-slate-100" />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-4 w-44 animate-pulse rounded bg-slate-100" />
        <div className="mt-2 h-3 w-64 animate-pulse rounded bg-slate-100" />

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="h-10 animate-pulse rounded-md bg-slate-100" />
          <div className="h-10 animate-pulse rounded-md bg-slate-100" />

          <div className="flex h-12 items-center gap-3 rounded-md border border-slate-100 px-3">
            <div className="h-4 w-4 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="flex h-12 items-center gap-3 rounded-md border border-slate-100 px-3">
            <div className="h-4 w-4 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="flex h-12 items-center gap-3 rounded-md border border-slate-100 px-3">
            <div className="h-4 w-4 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="flex h-12 items-center gap-3 rounded-md border border-slate-100 px-3">
            <div className="h-4 w-4 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <div className="h-10 w-40 animate-pulse rounded-md bg-slate-100" />
        </div>
      </section>
    </div>
  );
}
