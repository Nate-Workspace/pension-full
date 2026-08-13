"use client";

import { useEffect, useState } from "react";

import {
  CmsEditorHeader,
  CmsField,
  CmsFormPanel,
  cmsInputClassName,
  cmsTextareaClassName,
} from "@/components/cms/cms-editor-ui";
import { useCmsPageContent } from "@/components/cms/hooks/use-cms-page-content";
import { LoadingSpinner } from "@/components/ui";
import {
  buildSectionsPayload,
  sectionsToValues,
  type CmsSectionField,
} from "@/lib/cms-sections";
import type { CmsPageSlug } from "@repo/contracts";
import type { CmsNavSlug } from "@/lib/cms-navigation";
import { getCmsNavItem } from "@/lib/cms-navigation";

type CmsSectionsEditorProps = {
  slug: Exclude<CmsNavSlug, "global">;
  pageSlug: CmsPageSlug;
  fields: CmsSectionField[];
};

export function CmsSectionsEditor({ slug, pageSlug, fields }: CmsSectionsEditorProps) {
  const navItem = getCmsNavItem(slug);
  const { page, isLoading, isSaving, error, saveMessage, save } = useCmsPageContent(pageSlug);
  const [values, setValues] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (page) {
      setValues(sectionsToValues(fields, page.sections));
    }
  }, [fields, page]);

  const handleSave = () => {
    setFormError(null);

    void (async () => {
      try {
        await save({
          sections: buildSectionsPayload(fields, values),
        });
      } catch (saveError) {
        setFormError(
          saveError instanceof Error ? saveError.message : "Unable to save page content.",
        );
      }
    })();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center gap-3 text-sm text-slate-600">
        <LoadingSpinner className="h-5 w-5" />
        <span>Loading {navItem?.label ?? slug} editor...</span>
      </div>
    );
  }

  return (
    <div>
      <CmsEditorHeader
        slug={slug}
        title={navItem?.label ?? slug}
        description={navItem?.description ?? "Edit page content."}
      />

      {saveMessage ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {saveMessage}
        </div>
      ) : null}

      {formError || error ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError ??
            (error instanceof Error ? error.message : "Unable to load page content.")}
        </div>
      ) : null}

      <CmsFormPanel onSave={handleSave} isSaving={isSaving}>
        <div className="space-y-5">
          {fields.map((field) => (
            <CmsField key={field.key} label={field.label} hint={field.hint}>
              {field.multiline ? (
                <textarea
                  value={values[field.key] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                  className={cmsTextareaClassName}
                />
              ) : (
                <input
                  type="text"
                  value={values[field.key] ?? ""}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, [field.key]: event.target.value }))
                  }
                  className={cmsInputClassName}
                />
              )}
            </CmsField>
          ))}
        </div>
      </CmsFormPanel>
    </div>
  );
}
