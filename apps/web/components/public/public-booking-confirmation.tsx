"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { PublicBookingCheckoutResponse } from "@repo/contracts";

import { formatStayDates } from "@/lib/public-calendar";
import { formatPublicPrice } from "@/lib/public-content";

import { PublicPageHero } from "./public-page-sections";

type PublicBookingConfirmationProps = {
  code: string;
};

function readStoredConfirmation(
  code: string,
): PublicBookingCheckoutResponse | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(`public-booking-confirmation:${code}`);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PublicBookingCheckoutResponse;
  } catch {
    return null;
  }
}

export function PublicBookingConfirmation({ code }: PublicBookingConfirmationProps) {
  const [confirmation, setConfirmation] = useState<PublicBookingCheckoutResponse | null>(
    null,
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setConfirmation(readStoredConfirmation(code));
    setIsReady(true);
  }, [code]);

  return (
    <div>
      <PublicPageHero
        eyebrow="Booking confirmed"
        title="Your stay is confirmed"
        description="Save your booking reference below. You can look up this reservation anytime."
      />

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-sm">
          <p className="text-sm uppercase tracking-[0.18em] text-emerald-800">
            Booking reference
          </p>
          <p className="mt-3 break-all text-4xl font-semibold tracking-wide text-emerald-950 sm:text-5xl">
            {code}
          </p>
        </div>

        {isReady && confirmation ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Booking summary</h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Guest</dt>
                  <dd className="font-medium text-slate-900">{confirmation.guestName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Room</dt>
                  <dd className="text-right font-medium text-slate-900">
                    {confirmation.roomName} · Room {confirmation.roomNumber}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Stay dates</dt>
                  <dd className="font-medium text-slate-900">
                    {formatStayDates(confirmation.checkInDate, confirmation.checkOutDate)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Nights</dt>
                  <dd className="font-medium text-slate-900">{confirmation.nights}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Check-in / Check-out</dt>
                  <dd className="text-right font-medium text-slate-900">
                    {confirmation.defaultCheckInTime} / {confirmation.defaultCheckOutTime}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-slate-200 pt-4">
                  <dt className="text-base font-semibold text-slate-900">Total paid</dt>
                  <dd className="text-base font-semibold text-slate-900">
                    {formatPublicPrice(confirmation.totalAmount)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm leading-relaxed text-slate-700">
                Confirmation saved — email confirmation coming soon. Keep your booking
                reference handy for check-in and future updates.
              </p>
            </div>
          </div>
        ) : isReady ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm leading-relaxed text-slate-700">
              Confirmation saved — email confirmation coming soon. Use your booking
              reference with the phone or email you provided to view full details.
            </p>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/booking/track"
            className="inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Track my booking
          </Link>
          <Link
            href="/rooms"
            className="inline-flex rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Browse rooms
          </Link>
        </div>
      </section>
    </div>
  );
}
