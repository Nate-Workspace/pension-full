import Link from "next/link";

import type { PublicPensionResponse, PublicRoomResponse } from "@repo/contracts";

import {
  formatPhoneHref,
  formatPublicPrice,
  getSectionContent,
} from "@/lib/public-content";
import type { SiteContentResponse } from "@repo/contracts";

import {
  PublicEmptyState,
  PublicOfflineBanner,
  PublicPageHero,
} from "./public-page-sections";

type PublicRoomsListProps = {
  pension: PublicPensionResponse;
  siteContent: SiteContentResponse;
  rooms: PublicRoomResponse[];
  isOffline?: boolean;
};

function getRoomStatusLabel(status: PublicRoomResponse["status"]): string {
  switch (status) {
    case "available":
      return "Available";
    case "occupied":
      return "Currently occupied";
    case "cleaning":
      return "Being prepared";
    default:
      return status;
  }
}

export function PublicRoomsList({
  pension,
  siteContent,
  rooms,
  isOffline = false,
}: PublicRoomsListProps) {
  const headline =
    getSectionContent(siteContent, "rooms", "headline") || "Our rooms";
  const intro =
    getSectionContent(siteContent, "rooms", "intro") ||
    "Browse every room we offer online. Each listing shows nightly rates, capacity, and current availability status.";

  return (
    <div>
      {isOffline ? <PublicOfflineBanner /> : null}

      <PublicPageHero title={headline} description={intro} eyebrow="Stay with us" />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {rooms.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => (
              <article
                key={room.id}
                className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                      {room.type}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                      {room.name}
                    </h2>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {getRoomStatusLabel(room.status)}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-600">
                  Room {room.number} · Floor {room.floor} · Sleeps {room.capacity}
                </p>

                <p className="mt-5 text-3xl font-semibold text-slate-900">
                  {formatPublicPrice(room.pricePerNight)}
                  <span className="text-sm font-normal text-slate-500"> / night</span>
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/rooms/${room.id}`}
                    className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    View room
                  </Link>
                  {pension.contactPhone ? (
                    <a
                      href={formatPhoneHref(pension.contactPhone)}
                      className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Call to book
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <PublicEmptyState
            title="No rooms listed yet"
            description="Room inventory will appear here once rooms are available for guests to browse."
          />
        )}
      </section>
    </div>
  );
}
