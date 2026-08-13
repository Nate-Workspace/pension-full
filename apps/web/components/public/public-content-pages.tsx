import type { SiteContentResponse } from "@repo/contracts";

import { getSectionContent } from "@/lib/public-content";

import {
  PublicEmptyState,
  PublicOfflineBanner,
  PublicPageHero,
} from "./public-page-sections";

type PublicGalleryProps = {
  siteContent: SiteContentResponse;
  isOffline?: boolean;
};

export function PublicGallery({
  siteContent,
  isOffline = false,
}: PublicGalleryProps) {
  const items = [...siteContent.gallery].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );

  return (
    <div>
      {isOffline ? <PublicOfflineBanner /> : null}

      <PublicPageHero
        eyebrow="Gallery"
        title="A look around the guesthouse"
        description="Photos from the property, rooms, and shared spaces."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {items.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <figure
                key={item.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="aspect-[4/3] bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.caption || "Guesthouse photo"}
                    className="h-full w-full object-cover"
                  />
                </div>
                {item.caption ? (
                  <figcaption className="px-4 py-3 text-sm text-slate-600">
                    {item.caption}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        ) : (
          <PublicEmptyState
            title="Gallery coming soon"
            description="Photos will appear here once they are added in the website CMS."
          />
        )}
      </section>
    </div>
  );
}

type PublicAboutProps = {
  siteContent: SiteContentResponse;
  isOffline?: boolean;
};

export function PublicAbout({ siteContent, isOffline = false }: PublicAboutProps) {
  const story =
    siteContent.config.aboutDescription.trim() ||
    getSectionContent(siteContent, "about", "story") ||
    "Our guesthouse story will appear here once it is published in the CMS.";
  const ownerBio = getSectionContent(siteContent, "about", "ownerBio");

  return (
    <div>
      {isOffline ? <PublicOfflineBanner /> : null}

      <PublicPageHero
        eyebrow="About"
        title="Welcome to our guesthouse"
        description={siteContent.config.tagline || undefined}
      />

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="space-y-8 text-lg leading-relaxed text-slate-700">
          <p className="whitespace-pre-line">{story}</p>
          {ownerBio ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-base font-semibold uppercase tracking-[0.16em] text-slate-500">
                From the hosts
              </h2>
              <p className="mt-3 whitespace-pre-line text-base text-slate-700">
                {ownerBio}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

type PublicAmenitiesProps = {
  siteContent: SiteContentResponse;
  isOffline?: boolean;
};

export function PublicAmenities({
  siteContent,
  isOffline = false,
}: PublicAmenitiesProps) {
  const amenities = [...siteContent.amenities].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );

  return (
    <div>
      {isOffline ? <PublicOfflineBanner /> : null}

      <PublicPageHero
        eyebrow="Amenities"
        title="Comforts included in your stay"
        description="Everything guests can expect during their visit."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {amenities.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {amenities.map((amenity) => (
              <article
                key={amenity.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-semibold text-emerald-700">
                    {amenity.icon.trim() || "✓"}
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {amenity.name}
                    </h2>
                    {amenity.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {amenity.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <PublicEmptyState
            title="Amenities coming soon"
            description="Amenities will be listed here once they are added in the website CMS."
          />
        )}
      </section>
    </div>
  );
}

type PublicAttractionsProps = {
  siteContent: SiteContentResponse;
  isOffline?: boolean;
};

export function PublicAttractions({
  siteContent,
  isOffline = false,
}: PublicAttractionsProps) {
  const attractions = [...siteContent.attractions].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );

  return (
    <div>
      {isOffline ? <PublicOfflineBanner /> : null}

      <PublicPageHero
        eyebrow="Nearby"
        title="Explore the area"
        description="Places worth visiting around the guesthouse."
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {attractions.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {attractions.map((attraction) => (
              <article
                key={attraction.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                {attraction.imageUrl ? (
                  <div className="aspect-[16/9] bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={attraction.imageUrl}
                      alt={attraction.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-semibold text-slate-900">
                      {attraction.name}
                    </h2>
                    {attraction.distance ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {attraction.distance}
                      </span>
                    ) : null}
                  </div>
                  {attraction.description ? (
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {attraction.description}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <PublicEmptyState
            title="Local highlights coming soon"
            description="Nearby attractions will appear here once they are added in the website CMS."
          />
        )}
      </section>
    </div>
  );
}
