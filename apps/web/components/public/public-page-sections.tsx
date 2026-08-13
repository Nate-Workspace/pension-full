type PublicPageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PublicPageHero({
  eyebrow,
  title,
  description,
}: PublicPageHeroProps) {
  return (
    <section className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {eyebrow ? (
          <p className="text-sm uppercase tracking-[0.22em] text-emerald-700">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function PublicOfflineBanner() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:px-6">
      Live guesthouse content is temporarily unavailable. Showing a basic preview
      while the API reconnects.
    </div>
  );
}

export function PublicEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}
