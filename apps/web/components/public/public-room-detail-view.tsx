"use client";

import Link from "next/link";
import { useCallback } from "react";

import type {
  PublicPensionResponse,
  PublicRoomAvailabilityResponse,
  PublicRoomResponse,
  SiteContentResponse,
} from "@repo/contracts";

import {
  formatPhoneHref,
  formatPublicPrice,
} from "@/lib/public-content";
import {
  countNights,
  formatStayDates,
} from "@/lib/public-calendar";

import { usePublicRoomBookingCalendar } from "./hooks/use-public-room-booking-calendar";
import { PublicRoomAvailabilityCalendar } from "./public-room-availability-calendar";
import { PublicOfflineBanner, PublicPageHero } from "./public-page-sections";

type PublicRoomDetailViewProps = {
  pension: PublicPensionResponse;
  siteContent: SiteContentResponse;
  room: PublicRoomResponse;
  initialAvailability: PublicRoomAvailabilityResponse | null;
  isOffline?: boolean;
  onBookOnline?: (input: {
    checkInDate: string;
    checkOutDate: string;
    nights: number;
  }) => void;
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

function PublicBookingActions({
  allowOnlineBookings,
  room,
  pension,
  canBookOnline,
  selectedCheckIn,
  selectedCheckOut,
  onBookOnline,
  layout = "sidebar",
}: {
  allowOnlineBookings: boolean;
  room: PublicRoomResponse;
  pension: PublicPensionResponse;
  canBookOnline: boolean;
  selectedCheckIn: string | null;
  selectedCheckOut: string | null;
  onBookOnline: () => void;
  layout?: "sidebar" | "sticky";
}) {
  const showOnlineBooking =
    allowOnlineBookings && room.status === "available";
  const hasDates = Boolean(selectedCheckIn && selectedCheckOut);
  const nights =
    selectedCheckIn && selectedCheckOut
      ? countNights(selectedCheckIn, selectedCheckOut)
      : 0;
  const estimatedTotal = nights * room.pricePerNight;

  return (
    <div className={layout === "sticky" ? "space-y-2" : "space-y-3"}>
      {showOnlineBooking ? (
        <button
          type="button"
          onClick={onBookOnline}
          disabled={!canBookOnline}
          className={`inline-flex w-full justify-center rounded-full px-4 py-3 text-sm font-semibold transition ${
            canBookOnline
              ? "bg-white text-slate-950 hover:bg-slate-100"
              : "cursor-not-allowed bg-white/20 text-white/70"
          }`}
        >
          Book online
        </button>
      ) : null}

      {pension.contactPhone ? (
        <a
          href={formatPhoneHref(pension.contactPhone)}
          className={`inline-flex w-full justify-center rounded-full px-4 py-3 text-sm font-semibold transition ${
            showOnlineBooking
              ? "border border-white/20 text-white hover:bg-white/10"
              : "bg-white text-slate-950 hover:bg-slate-100"
          }`}
        >
          Call to book
        </a>
      ) : (
        <Link
          href="/contact"
          className={`inline-flex w-full justify-center rounded-full px-4 py-3 text-sm font-semibold transition ${
            showOnlineBooking
              ? "border border-white/20 text-white hover:bg-white/10"
              : "bg-white text-slate-950 hover:bg-slate-100"
          }`}
        >
          Contact us to book
        </Link>
      )}

      {layout === "sidebar" && hasDates && selectedCheckIn && selectedCheckOut ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
          <p className="font-medium text-white">
            {formatStayDates(selectedCheckIn, selectedCheckOut)}
          </p>
          <p className="mt-2 text-slate-300">
            {nights} {nights === 1 ? "night" : "nights"} ·{" "}
            {formatPublicPrice(estimatedTotal)} estimated total
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function PublicRoomDetailView({
  pension,
  siteContent,
  room,
  initialAvailability,
  isOffline = false,
  onBookOnline,
}: PublicRoomDetailViewProps) {
  const allowOnlineBookings = siteContent.config.allowOnlineBookings;
  const calendar = usePublicRoomBookingCalendar({
    roomId: room.id,
    initialAvailability,
  });

  const handleBookOnline = useCallback(() => {
    if (
      !calendar.isSelectionValid ||
      !calendar.selectedCheckIn ||
      !calendar.selectedCheckOut
    ) {
      return;
    }

    onBookOnline?.({
      checkInDate: calendar.selectedCheckIn,
      checkOutDate: calendar.selectedCheckOut,
      nights: countNights(calendar.selectedCheckIn, calendar.selectedCheckOut),
    });
  }, [calendar, onBookOnline]);

  return (
    <div className="pb-24 lg:pb-0">
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

            <PublicRoomAvailabilityCalendar calendar={calendar} />
          </div>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white lg:sticky lg:top-24">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
              Ready to stay?
            </p>
            <p className="mt-3 text-3xl font-semibold">
              {formatPublicPrice(room.pricePerNight)}
              <span className="text-base font-normal text-slate-400"> / night</span>
            </p>

            <div className="mt-6">
              <PublicBookingActions
                allowOnlineBookings={allowOnlineBookings}
                room={room}
                pension={pension}
                canBookOnline={Boolean(calendar.isSelectionValid)}
                selectedCheckIn={calendar.selectedCheckIn}
                selectedCheckOut={calendar.selectedCheckOut}
                onBookOnline={handleBookOnline}
              />
            </div>

            <p className="mt-5 text-sm text-slate-400">
              {allowOnlineBookings
                ? "Select your dates on the calendar, then book online or call us anytime."
                : "Online booking is currently unavailable. Please call us to reserve this room."}
            </p>
          </aside>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-4 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-6xl gap-3">
          {allowOnlineBookings && room.status === "available" ? (
            <button
              type="button"
              onClick={handleBookOnline}
              disabled={!calendar.isSelectionValid}
              className={`inline-flex flex-1 justify-center rounded-full px-4 py-3 text-sm font-semibold transition ${
                calendar.isSelectionValid
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "cursor-not-allowed bg-slate-200 text-slate-500"
              }`}
            >
              Book online
            </button>
          ) : null}
          {pension.contactPhone ? (
            <a
              href={formatPhoneHref(pension.contactPhone)}
              className={`inline-flex justify-center rounded-full px-4 py-3 text-sm font-semibold transition ${
                allowOnlineBookings && room.status === "available"
                  ? "flex-1 border border-slate-200 text-slate-900 hover:bg-slate-50"
                  : "flex-1 bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              Call to book
            </a>
          ) : (
            <Link
              href="/contact"
              className="inline-flex flex-1 justify-center rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Contact us
            </Link>
          )}
        </div>
        {calendar.selectedCheckIn && calendar.selectedCheckOut ? (
          <p className="mx-auto mt-2 max-w-6xl text-center text-xs text-slate-500">
            {formatStayDates(calendar.selectedCheckIn, calendar.selectedCheckOut)}
          </p>
        ) : (
          <p className="mx-auto mt-2 max-w-6xl text-center text-xs text-slate-500">
            Select dates on the calendar to book online
          </p>
        )}
      </div>
    </div>
  );
}
