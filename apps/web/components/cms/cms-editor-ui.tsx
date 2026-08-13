"use client";

import Link from "next/link";

import { getCmsPreviewHref } from "@/components/cms/services/cms-service";
import type { CmsNavSlug } from "@/lib/cms-navigation";

type CmsEditorHeaderProps = {
  slug: CmsNavSlug;
  title: string;
  description: string;
};

export function CmsEditorHeader({ slug, title, description }: CmsEditorHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p>
      </div>

      <Link
        href={getCmsPreviewHref(slug)}
        target="_blank"
        className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Preview page
      </Link>
    </div>
  );
}

export function CmsFormPanel({
  children,
  onSave,
  isSaving,
  saveLabel = "Save changes",
}: {
  children: React.ReactNode;
  onSave: () => void;
  isSaving: boolean;
  saveLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {children}

      <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex h-10 items-center rounded-full bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : saveLabel}
        </button>
      </div>
    </div>
  );
}

export function CmsField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}
      {children}
    </label>
  );
}

export const cmsInputClassName =
  "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400";

export const cmsTextareaClassName =
  "min-h-[120px] w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400";
