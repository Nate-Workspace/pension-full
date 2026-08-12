"use client";

import Link from "next/link";

import { useCmsPages } from "@/components/cms/hooks/use-cms-pages";
import { getCmsPreviewHref } from "@/components/cms/services/cms-service";
import { LoadingSpinner } from "@/components/ui";

export function CmsManagement() {
  const pagesQuery = useCmsPages();

  if (pagesQuery.isPending) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-3 text-sm text-slate-600">
        <LoadingSpinner className="h-5 w-5" />
        <span>Loading CMS pages...</span>
      </div>
    );
  }

  if (pagesQuery.isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
        <h1 className="text-lg font-semibold">Website (CMS)</h1>
        <p className="mt-2 text-sm">
          {pagesQuery.error instanceof Error
            ? pagesQuery.error.message
            : "Unable to load CMS pages."}
        </p>
      </div>
    );
  }

  const pages = pagesQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Website (CMS)</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Manage public guesthouse content separately from operational settings.
          Page editors and mobile-first workflows arrive in the next CMS phase.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pages.map((page) => (
          <article
            key={page.slug}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{page.title}</h2>
                <p className="mt-1 text-sm capitalize text-slate-500">{page.slug}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  page.isComplete
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {page.isComplete ? "Complete" : "Needs content"}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={getCmsPreviewHref(page.slug)}
                target="_blank"
                className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Preview page
              </Link>
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-500">
                Editor coming soon
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
