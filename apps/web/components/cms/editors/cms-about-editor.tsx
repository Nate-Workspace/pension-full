"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CmsEditorHeader,
  CmsField,
  CmsFormPanel,
  cmsTextareaClassName,
} from "@/components/cms/cms-editor-ui";
import { useCmsGlobal } from "@/components/cms/hooks/use-cms-global";
import { useCmsPageContent } from "@/components/cms/hooks/use-cms-page-content";
import { LoadingSpinner } from "@/components/ui";
import { getSectionValue } from "@/lib/cms-sections";

type AboutFormState = {
  story: string;
  ownerBio: string;
};

export function CmsAboutEditor() {
  const pageQuery = useCmsPageContent("about");
  const globalQuery = useCmsGlobal();
  const [form, setForm] = useState<AboutFormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const isLoading = pageQuery.isLoading || globalQuery.isLoading;
  const isSaving = pageQuery.isSaving || globalQuery.isSaving;

  const initialForm = useMemo<AboutFormState | null>(() => {
    if (!pageQuery.page || !globalQuery.config) {
      return null;
    }

    return {
      story: globalQuery.config.aboutDescription,
      ownerBio: getSectionValue(pageQuery.page.sections, "ownerBio"),
    };
  }, [globalQuery.config, pageQuery.page]);

  useEffect(() => {
    if (initialForm) {
      setForm(initialForm);
    }
  }, [initialForm]);

  const handleSave = () => {
    if (!form) {
      return;
    }

    setFormError(null);
    setSaveMessage(null);

    void (async () => {
      try {
        await globalQuery.save({ aboutDescription: form.story });
        await pageQuery.save({
          sections: [
            {
              sectionKey: "ownerBio",
              content: form.ownerBio,
              sortOrder: 0,
            },
          ],
        });
        setSaveMessage("About page content saved.");
      } catch (saveError) {
        setFormError(
          saveError instanceof Error ? saveError.message : "Unable to save about page.",
        );
      }
    })();
  };

  if (isLoading || !form) {
    return (
      <div className="flex min-h-[240px] items-center justify-center gap-3 text-sm text-slate-600">
        <LoadingSpinner className="h-5 w-5" />
        <span>Loading about page editor...</span>
      </div>
    );
  }

  const loadError = pageQuery.error ?? globalQuery.error;

  return (
    <div>
      <CmsEditorHeader
        slug="about"
        title="About"
        description="Guesthouse story and host message shown on the public about page."
      />

      {saveMessage ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {saveMessage}
        </div>
      ) : null}

      {formError || loadError ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError ??
            (loadError instanceof Error ? loadError.message : "Unable to load about page.")}
        </div>
      ) : null}

      <CmsFormPanel onSave={handleSave} isSaving={isSaving}>
        <div className="space-y-5">
          <CmsField label="Story" hint="Main about text on the public about page.">
            <textarea
              value={form.story}
              onChange={(event) =>
                setForm((current) =>
                  current ? { ...current, story: event.target.value } : current,
                )
              }
              className={`${cmsTextareaClassName} min-h-[200px]`}
            />
          </CmsField>

          <CmsField label="Owner bio" hint='Optional "From the hosts" section.'>
            <textarea
              value={form.ownerBio}
              onChange={(event) =>
                setForm((current) =>
                  current ? { ...current, ownerBio: event.target.value } : current,
                )
              }
              className={cmsTextareaClassName}
            />
          </CmsField>
        </div>
      </CmsFormPanel>
    </div>
  );
}
