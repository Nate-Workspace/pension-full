"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CmsEditorHeader,
  CmsField,
  CmsFormPanel,
  cmsInputClassName,
  cmsTextareaClassName,
} from "@/components/cms/cms-editor-ui";
import { useCmsGlobal } from "@/components/cms/hooks/use-cms-global";
import { useCmsPageContent } from "@/components/cms/hooks/use-cms-page-content";
import { LoadingSpinner } from "@/components/ui";

type ContactFormState = {
  intro: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  city: string;
};

import { getSectionValue } from "@/lib/cms-sections";

export function CmsContactEditor() {
  const pageQuery = useCmsPageContent("contact");
  const globalQuery = useCmsGlobal();
  const [form, setForm] = useState<ContactFormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const isLoading = pageQuery.isLoading || globalQuery.isLoading;
  const isSaving = pageQuery.isSaving || globalQuery.isSaving;

  const initialForm = useMemo<ContactFormState | null>(() => {
    if (!pageQuery.page || !globalQuery.config) {
      return null;
    }

    return {
      intro: getSectionValue(pageQuery.page.sections, "intro"),
      contactPhone: globalQuery.config.contactPhone,
      contactEmail: globalQuery.config.contactEmail,
      address: globalQuery.config.address,
      city: globalQuery.config.city,
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
        await globalQuery.save({
          contactPhone: form.contactPhone,
          contactEmail: form.contactEmail,
          address: form.address,
          city: form.city,
        });

        await pageQuery.save({
          sections: [
            {
              sectionKey: "intro",
              content: form.intro,
              sortOrder: 0,
            },
          ],
        });

        setSaveMessage("Contact page content saved.");
      } catch (saveError) {
        setFormError(
          saveError instanceof Error ? saveError.message : "Unable to save contact page.",
        );
      }
    })();
  };

  if (isLoading || !form) {
    return (
      <div className="flex min-h-[240px] items-center justify-center gap-3 text-sm text-slate-600">
        <LoadingSpinner className="h-5 w-5" />
        <span>Loading contact page editor...</span>
      </div>
    );
  }

  const loadError = pageQuery.error ?? globalQuery.error;

  return (
    <div>
      <CmsEditorHeader
        slug="contact"
        title="Contact"
        description="Phone, email, and address shown on the public contact page. Empty fields fall back to operational settings."
      />

      {saveMessage ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {saveMessage}
        </div>
      ) : null}

      {formError || loadError ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError ??
            (loadError instanceof Error ? loadError.message : "Unable to load contact page.")}
        </div>
      ) : null}

      <CmsFormPanel onSave={handleSave} isSaving={isSaving}>
        <div className="space-y-5">
          <CmsField
            label="Page intro"
            hint="Headline description shown at the top of the contact page."
          >
            <textarea
              value={form.intro}
              onChange={(event) =>
                setForm((current) =>
                  current ? { ...current, intro: event.target.value } : current,
                )
              }
              className={cmsTextareaClassName}
            />
          </CmsField>

          <div className="grid gap-4 sm:grid-cols-2">
            <CmsField label="Phone">
              <input
                type="text"
                value={form.contactPhone}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, contactPhone: event.target.value } : current,
                  )
                }
                className={cmsInputClassName}
                placeholder="+251 ..."
              />
            </CmsField>

            <CmsField label="Email">
              <input
                type="email"
                value={form.contactEmail}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, contactEmail: event.target.value } : current,
                  )
                }
                className={cmsInputClassName}
                placeholder="hello@guesthouse.com"
              />
            </CmsField>
          </div>

          <CmsField label="Street address">
            <input
              type="text"
              value={form.address}
              onChange={(event) =>
                setForm((current) =>
                  current ? { ...current, address: event.target.value } : current,
                )
              }
              className={cmsInputClassName}
            />
          </CmsField>

          <CmsField label="City">
            <input
              type="text"
              value={form.city}
              onChange={(event) =>
                setForm((current) =>
                  current ? { ...current, city: event.target.value } : current,
                )
              }
              className={cmsInputClassName}
            />
          </CmsField>
        </div>
      </CmsFormPanel>
    </div>
  );
}
