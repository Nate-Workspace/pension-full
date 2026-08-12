export default function CmsLoading() {
  return (
    <div className="space-y-6">
      <section>
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-[28rem] max-w-full animate-pulse rounded bg-slate-100" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-4 w-20 animate-pulse rounded bg-slate-100" />
            <div className="mt-5 h-8 w-28 animate-pulse rounded-full bg-slate-100" />
          </div>
        ))}
      </section>
    </div>
  );
}
