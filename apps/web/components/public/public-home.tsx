import Link from "next/link";

import type {
  PublicPensionResponse,
  PublicRoomResponse,
  SiteContentResponse,
} from "@repo/contracts";

type PublicHomeProps = {
  pension: PublicPensionResponse;
  siteContent: SiteContentResponse;
  rooms: PublicRoomResponse[];
  isOffline?: boolean;
};

function getSectionContent(
  siteContent: SiteContentResponse,
  pageSlug: string,
  sectionKey: string,
): string {
  return (
    siteContent.pages[pageSlug]?.find((section) => section.sectionKey === sectionKey)
      ?.content ?? ""
  ).trim();
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PublicHome({
  pension,
  siteContent,
  rooms,
  isOffline = false,
}: PublicHomeProps) {
  const config = siteContent.config;
  const heroHeadline =
    config.heroHeadline.trim() ||
    getSectionContent(siteContent, "home", "heroHeadline") ||
    `Welcome to ${pension.pensionName}`;
  const heroSubtext =
    config.heroSubtext.trim() ||
    getSectionContent(siteContent, "home", "heroSubtext") ||
    pension.tagline ||
    "Book your stay with transparent pricing and a team ready to help.";
  const introCopy =
    getSectionContent(siteContent, "home", "intro") ||
    getSectionContent(siteContent, "home", "ctaCopy") ||
    "Browse our rooms, explore the property, and reach out anytime if you prefer to book by phone.";
  const featuredRooms = rooms.slice(0, 3);

  return (
    <div>
      {isOffline && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:px-6">
          Live guesthouse content is temporarily unavailable. Showing a basic
          preview while the API reconnects.
        </div>
      )}

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.25),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.18),_transparent_40%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">
              {pension.tagline || "Guesthouse stays, made simple"}
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              {heroHeadline}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-300">{heroSubtext}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Plan your stay
              </Link>
              {pension.contactPhone ? (
                <a
                  href={`tel:${pension.contactPhone.replace(/\s+/g, "")}`}
                  className="inline-flex rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Call to book
                </a>
              ) : (
                <Link
                  href="/contact"
                  className="inline-flex rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Contact us
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Stay details
            </p>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-slate-400">Check-in</dt>
                <dd className="mt-1 text-lg font-medium">{pension.defaultCheckInTime}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Check-out</dt>
                <dd className="mt-1 text-lg font-medium">{pension.defaultCheckOutTime}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Location</dt>
                <dd className="mt-1 text-lg font-medium">
                  {[pension.address, pension.city].filter(Boolean).join(", ") ||
                    "Contact us for directions"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Contact</dt>
                <dd className="mt-1 text-lg font-medium">
                  {pension.contactPhone || pension.contactEmail || "Available on request"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight">Plan your stay</h2>
          <p className="mt-4 text-lg text-slate-600">{introCopy}</p>
        </div>

        {featuredRooms.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featuredRooms.map((room) => (
              <article
                key={room.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                  {room.type}
                </p>
                <h3 className="mt-2 text-xl font-semibold">{room.name}</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Sleeps {room.capacity} · Floor {room.floor}
                </p>
                <p className="mt-4 text-2xl font-semibold text-slate-900">
                  {formatPrice(room.pricePerNight)}
                  <span className="text-sm font-normal text-slate-500"> / night</span>
                </p>
                {pension.contactPhone ? (
                  <a
                    href={`tel:${pension.contactPhone.replace(/\s+/g, "")}`}
                    className="mt-6 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Call to book this room
                  </a>
                ) : (
                  <Link
                    href="/contact"
                    className="mt-6 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Contact us to book
                  </Link>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600">
            Room listings will appear here once rooms are available for online booking.
          </div>
        )}
      </section>
    </div>
  );
}
