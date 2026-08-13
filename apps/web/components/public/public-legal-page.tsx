import type { SiteContentResponse } from "@repo/contracts";

import { PublicOfflineBanner, PublicPageHero } from "./public-page-sections";

type PublicLegalPageProps = {
  siteContent: SiteContentResponse;
  isOffline?: boolean;
  kind: "terms" | "privacy";
};

function getLegalContent(
  siteContent: SiteContentResponse,
  kind: "terms" | "privacy",
): { title: string; body: string; fallback: string } {
  if (kind === "terms") {
    return {
      title: "Terms of service",
      body: siteContent.config.termsText.trim(),
      fallback:
        "Terms of service will be published here once they are configured in the website CMS.",
    };
  }

  return {
    title: "Privacy policy",
    body: siteContent.config.privacyText.trim(),
    fallback:
      "Privacy policy will be published here once it is configured in the website CMS.",
  };
}

export function PublicLegalPage({
  siteContent,
  isOffline = false,
  kind,
}: PublicLegalPageProps) {
  const legal = getLegalContent(siteContent, kind);

  return (
    <div>
      {isOffline ? <PublicOfflineBanner /> : null}

      <PublicPageHero
        eyebrow="Legal"
        title={legal.title}
        description="Clear policies for booking and staying with us."
      />

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="whitespace-pre-line text-base leading-relaxed text-slate-700">
            {legal.body || legal.fallback}
          </p>
        </div>
      </section>
    </div>
  );
}
