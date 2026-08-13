import type { PublicPensionResponse, SiteContentResponse } from "@repo/contracts";

import { formatPhoneHref, getSectionContent } from "@/lib/public-content";

import {
  PublicOfflineBanner,
  PublicPageHero,
} from "./public-page-sections";

type PublicContactProps = {
  pension: PublicPensionResponse;
  siteContent: SiteContentResponse;
  isOffline?: boolean;
};

export function PublicContact({
  pension,
  siteContent,
  isOffline = false,
}: PublicContactProps) {
  const config = siteContent.config;
  const intro =
    getSectionContent(siteContent, "contact", "intro") ||
    "Reach out for directions, availability questions, or phone bookings.";
  const contactPhone = config.contactPhone.trim() || pension.contactPhone;
  const contactEmail = config.contactEmail.trim() || pension.contactEmail;
  const address = config.address.trim() || pension.address;
  const city = config.city.trim() || pension.city;
  const locationLabel = [address, city].filter(Boolean).join(", ");
  const mapEmbedUrl = config.mapEmbedUrl.trim();

  return (
    <div>
      {isOffline ? <PublicOfflineBanner /> : null}

      <PublicPageHero
        eyebrow="Contact"
        title="We are here to help"
        description={intro}
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Get in touch</h2>
            <dl className="space-y-4 text-sm">
              {contactPhone ? (
                <div>
                  <dt className="text-slate-500">Phone</dt>
                  <dd className="mt-1 text-base font-medium">
                    <a
                      href={formatPhoneHref(contactPhone)}
                      className="text-emerald-700 hover:text-emerald-800"
                    >
                      {contactPhone}
                    </a>
                  </dd>
                </div>
              ) : null}
              {contactEmail ? (
                <div>
                  <dt className="text-slate-500">Email</dt>
                  <dd className="mt-1 text-base font-medium">
                    <a
                      href={`mailto:${contactEmail}`}
                      className="text-emerald-700 hover:text-emerald-800"
                    >
                      {contactEmail}
                    </a>
                  </dd>
                </div>
              ) : null}
              {locationLabel ? (
                <div>
                  <dt className="text-slate-500">Address</dt>
                  <dd className="mt-1 text-base font-medium">{locationLabel}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-slate-500">Check-in / Check-out</dt>
                <dd className="mt-1 text-base font-medium">
                  {pension.defaultCheckInTime} / {pension.defaultCheckOutTime}
                </dd>
              </div>
            </dl>

            {contactPhone ? (
              <a
                href={formatPhoneHref(contactPhone)}
                className="mt-4 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Call now
              </a>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {mapEmbedUrl ? (
              <iframe
                title="Guesthouse location map"
                src={mapEmbedUrl}
                className="min-h-[24rem] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex min-h-[24rem] items-center justify-center bg-slate-50 p-8 text-center text-sm text-slate-600">
                Map directions will appear here once the Google Maps embed is configured
                in the website CMS.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

type PublicFaqProps = {
  siteContent: SiteContentResponse;
  isOffline?: boolean;
};

export function PublicFaq({ siteContent, isOffline = false }: PublicFaqProps) {
  const faqs = [...siteContent.faqs].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );

  return (
    <div>
      {isOffline ? <PublicOfflineBanner /> : null}

      <PublicPageHero
        eyebrow="FAQ"
        title="Common questions"
        description="Quick answers about bookings, check-in, and your stay."
      />

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {faqs.length > 0 ? (
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <summary className="cursor-pointer list-none text-base font-semibold text-slate-900 marker:content-none">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <h2 className="text-lg font-semibold text-slate-900">FAQ coming soon</h2>
            <p className="mt-2 text-sm text-slate-600">
              Questions and answers will appear here once they are added in the website CMS.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
