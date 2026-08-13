"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import {
  cmsNavigation,
  getCmsEditorHref,
  type CmsNavSlug,
} from "@/lib/cms-navigation";

type CmsShellProps = {
  children: ReactNode;
};

function getActiveSlug(pathname: string): CmsNavSlug | null {
  const match = pathname.match(/^\/cms\/([^/]+)/);
  const slug = match?.[1];

  if (!slug) {
    return null;
  }

  return cmsNavigation.some((item) => item.slug === slug)
    ? (slug as CmsNavSlug)
    : null;
}

function isNavActive(pathname: string, slug: CmsNavSlug): boolean {
  return pathname === getCmsEditorHref(slug);
}

export function CmsShell({ children }: CmsShellProps) {
  const pathname = usePathname();
  const activeSlug = getActiveSlug(pathname);
  const activeItem = cmsNavigation.find((item) => item.slug === activeSlug);

  return (
    <div className="pb-24 lg:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Website (CMS)
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Manage public guesthouse content separately from operational settings.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="hidden w-64 shrink-0 lg:block">
          <nav
            aria-label="CMS pages"
            className="sticky top-24 space-y-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
          >
            {cmsNavigation.map((item) => {
              const active = isNavActive(pathname, item.slug);

              return (
                <Link
                  key={item.slug}
                  href={getCmsEditorHref(item.slug)}
                  className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          {activeItem ? (
            <div className="mb-4 lg:hidden">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Editing
              </p>
              <p className="text-lg font-semibold text-slate-900">{activeItem.label}</p>
              <p className="mt-1 text-sm text-slate-600">{activeItem.description}</p>
            </div>
          ) : null}

          {children}
        </div>
      </div>

      <nav
        aria-label="CMS mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden"
      >
        <div className="flex gap-1 overflow-x-auto px-2 py-2">
          {cmsNavigation.map((item) => {
            const active = isNavActive(pathname, item.slug);

            return (
              <Link
                key={item.slug}
                href={getCmsEditorHref(item.slug)}
                className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${
                  active
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
