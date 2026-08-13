"use client";

import { useEffect, useState } from "react";

import {
  CmsEditorHeader,
  CmsField,
  CmsFormPanel,
  cmsInputClassName,
  cmsTextareaClassName,
} from "@/components/cms/cms-editor-ui";
import { useCmsGlobal } from "@/components/cms/hooks/use-cms-global";
import { LoadingSpinner } from "@/components/ui";
import type { CmsGlobalUpdateInput } from "@repo/contracts";

type GlobalFormState = {
  tagline: string;
  heroImageUrl: string;
  heroHeadline: string;
  heroSubtext: string;
  allowOnlineBookings: boolean;
  cancellationPolicy: string;
  termsText: string;
  privacyText: string;
  mapEmbedUrl: string;
};

function toFormState(config: CmsGlobalUpdateInput & { allowOnlineBookings: boolean }): GlobalFormState {
  return {
    tagline: config.tagline ?? "",
    heroImageUrl: config.heroImageUrl ?? "",
    heroHeadline: config.heroHeadline ?? "",
    heroSubtext: config.heroSubtext ?? "",
    allowOnlineBookings: config.allowOnlineBookings,
    cancellationPolicy: config.cancellationPolicy ?? "",
    termsText: config.termsText ?? "",
    privacyText: config.privacyText ?? "",
    mapEmbedUrl: config.mapEmbedUrl ?? "",
  };
}

export function CmsGlobalEditor() {
  const { config, isLoading, isSaving, error, saveMessage, save } = useCmsGlobal();
  const [form, setForm] = useState<GlobalFormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setForm(toFormState(config));
    }
  }, [config]);

  const handleSave = () => {
    if (!form) {
      return;
    }

    setFormError(null);

    void (async () => {
      try {
        await save({
          tagline: form.tagline,
          heroImageUrl: form.heroImageUrl,
          heroHeadline: form.heroHeadline,
          heroSubtext: form.heroSubtext,
          allowOnlineBookings: form.allowOnlineBookings,
          cancellationPolicy: form.cancellationPolicy,
          termsText: form.termsText,
          privacyText: form.privacyText,
          mapEmbedUrl: form.mapEmbedUrl,
        });
      } catch (saveError) {
        setFormError(
          saveError instanceof Error ? saveError.message : "Unable to save global settings.",
        );
      }
    })();
  };

  if (isLoading || !form) {
    return (
      <div className="flex min-h-[240px] items-center justify-center gap-3 text-sm text-slate-600">
        <LoadingSpinner className="h-5 w-5" />
        <span>Loading global settings...</span>
      </div>
    );
  }

  return (
    <div>
      <CmsEditorHeader
        slug="global"
        title="Global"
        description="Site-wide defaults, legal copy, booking rules, and map embed used across the public site."
      />

      {saveMessage ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {saveMessage}
        </div>
      ) : null}

      {formError || error ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError ?? (error instanceof Error ? error.message : "Unable to load global settings.")}
        </div>
      ) : null}

      <CmsFormPanel onSave={handleSave} isSaving={isSaving}>
        <div className="space-y-5">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Brand defaults
            </h3>

            <CmsField label="Tagline" hint="Short line shown in the site header and footer.">
              <input
                type="text"
                value={form.tagline}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, tagline: event.target.value } : current,
                  )
                }
                className={cmsInputClassName}
              />
            </CmsField>

            <CmsField label="Hero headline">
              <input
                type="text"
                value={form.heroHeadline}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, heroHeadline: event.target.value } : current,
                  )
                }
                className={cmsInputClassName}
              />
            </CmsField>

            <CmsField label="Hero subtext">
              <textarea
                value={form.heroSubtext}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, heroSubtext: event.target.value } : current,
                  )
                }
                className={cmsTextareaClassName}
              />
            </CmsField>

            <CmsField label="Hero image URL">
              <input
                type="url"
                value={form.heroImageUrl}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, heroImageUrl: event.target.value } : current,
                  )
                }
                className={cmsInputClassName}
                placeholder="https://..."
              />
            </CmsField>
          </section>

          <section className="space-y-4 border-t border-slate-100 pt-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Booking rules
            </h3>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <input
                type="checkbox"
                checked={form.allowOnlineBookings}
                onChange={(event) =>
                  setForm((current) =>
                    current
                      ? { ...current, allowOnlineBookings: event.target.checked }
                      : current,
                  )
                }
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <span>
                <span className="block text-sm font-medium text-slate-800">
                  Allow online bookings
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  When disabled, guests can still browse rooms but cannot complete Pay now checkout.
                </span>
              </span>
            </label>

            <CmsField
              label="Cancellation policy"
              hint="Shown in the booking modal before payment."
            >
              <textarea
                value={form.cancellationPolicy}
                onChange={(event) =>
                  setForm((current) =>
                    current
                      ? { ...current, cancellationPolicy: event.target.value }
                      : current,
                  )
                }
                className={cmsTextareaClassName}
              />
            </CmsField>
          </section>

          <section className="space-y-4 border-t border-slate-100 pt-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Legal pages
            </h3>

            <CmsField label="Terms of service" hint="Content for /terms.">
              <textarea
                value={form.termsText}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, termsText: event.target.value } : current,
                  )
                }
                className={`${cmsTextareaClassName} min-h-[180px]`}
              />
            </CmsField>

            <CmsField label="Privacy policy" hint="Content for /privacy.">
              <textarea
                value={form.privacyText}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, privacyText: event.target.value } : current,
                  )
                }
                className={`${cmsTextareaClassName} min-h-[180px]`}
              />
            </CmsField>
          </section>

          <section className="space-y-4 border-t border-slate-100 pt-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Map embed
            </h3>

            <CmsField
              label="Google Maps embed URL"
              hint="Paste the iframe src URL. Contact page falls back to address-based embed when empty."
            >
              <input
                type="url"
                value={form.mapEmbedUrl}
                onChange={(event) =>
                  setForm((current) =>
                    current ? { ...current, mapEmbedUrl: event.target.value } : current,
                  )
                }
                className={cmsInputClassName}
                placeholder="https://www.google.com/maps/embed?..."
              />
            </CmsField>
          </section>
        </div>
      </CmsFormPanel>
    </div>
  );
}
