import Link from "next/link";

import type { PublicPensionResponse, PublicRoomResponse } from "@repo/contracts";
import type { SiteContentResponse } from "@repo/contracts";

import {
  formatPhoneHref,
  formatPublicPrice,
} from "@/lib/public-content";

import {
  PublicOfflineBanner,
  PublicPageHero,
} from "./public-page-sections";

type PublicRoomDetailProps = {
  pension: PublicPensionResponse;
  siteContent: SiteContentResponse;
  room: PublicRoomResponse;
  isOffline?: boolean;
};

function getRoomStatusLabel(status: PublicRoomResponse["status"]): string {
  switch (status) {
    case "available":
      return "Available to book";
    case "occupied":
      return "Currently occupied";
    case "cleaning":
      return "Being prepared for the next guest";
    default:
      return status;
  }
}

export function PublicRoomDetail({
  pension,
  siteContent,
  room,
  isOffline = false,
}: PublicRoomDetailProps) {
  const allowOnlineBookings = siteContent.config.allowOnlineBookings;

  return (
    <div>
      {isOffline ? <PublicOfflineBanner /> : null}

      <PublicPageHero
        eyebrow={`Room ${room.number}`}
        title={room.name}
        description={`${room.type} · Sleeps ${room.capacity} · Floor ${room.floor}`}
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Room details</h2>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-slate-500">Nightly rate</dt>
                  <dd className="mt-1 text-lg font-semibold">
                    {formatPublicPrice(room.pricePerNight)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Status</dt>
                  <dd className="mt-1 text-lg font-medium">
                    {getRoomStatusLabel(room.status)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Check-in</dt>
                  <dd className="mt-1 text-lg font-medium">
                    {pension.defaultCheckInTime}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Check-out</dt>
                  <dd className="mt-1 text-lg font-medium">
                    {pension.defaultCheckOutTime}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              Availability calendar and online booking checkout will appear here in
              the next phase step.
            </div>
          </div>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white lg:sticky lg:top-24">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
              Ready to stay?
            </p>
            <p className="mt-3 text-3xl font-semibold">
              {formatPublicPrice(room.pricePerNight)}
              <span className="text-base font-normal text-slate-400"> / night</span>
            </p>

            <div className="mt-6 space-y-3">
              {allowOnlineBookings && room.status === "available" ? (
                <button
                  type="button"
                  disabled
                  className="inline-flex w-full cursor-not-allowed justify-center rounded-full bg-white/20 px-4 py-3 text-sm font-semibold text-white/70"
                >
                  Book online (coming next)
                </button>
              ) : null}

              {pension.contactPhone ? (
                <a
                  href={formatPhoneHref(pension.contactPhone)}
                  className="inline-flex w-full justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Call to book
                </a>
              ) : (
                <Link
                  href="/contact"
                  className="inline-flex w-full justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Contact us to book
                </Link>
              )}
            </div>

            <p className="mt-5 text-sm text-slate-400">
              Transparent pricing with no hidden fees. Your booking reference will
              appear immediately after payment.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}
