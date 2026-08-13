"use client";

import { CmsEditorHeader } from "@/components/cms/cms-editor-ui";
import type { CmsNavSlug } from "@/lib/cms-navigation";
import { getCmsNavItem } from "@/lib/cms-navigation";

type CmsPlaceholderEditorProps = {
  slug: Exclude<CmsNavSlug, "global" | "contact">;
};

export function CmsPlaceholderEditor({ slug }: CmsPlaceholderEditorProps) {
  const navItem = getCmsNavItem(slug);

  return (
    <div>
      <CmsEditorHeader
        slug={slug}
        title={navItem?.label ?? slug}
        description={navItem?.description ?? "Page editor"}
      />

      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
        <p className="text-sm font-medium text-slate-700">
          {navItem?.label ?? slug} editor coming in the next CMS phase.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Use the preview link above to check the live public page.
        </p>
      </div>
    </div>
  );
}
