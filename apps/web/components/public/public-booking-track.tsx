"use client";

import { useState } from "react";

import type { PublicBookingLookupResponse } from "@repo/contracts";

import { formatStayDates } from "@/lib/public-calendar";
import { formatPublicPrice } from "@/lib/public-content";
import { lookupPublicBooking } from "@/lib/public-booking-service";

import { PublicPageHero } from "./public-page-sections";

function formatBookingStatus(status: PublicBookingLookupResponse["status"]): string {
  switch (status) {
    case "active":
      return "Currently checked in";
    case "upcoming":
      return "Upcoming";
    case "checked_out":
      return "Checked out";
    case "canceled":
      return "Canceled";
    default:
      return status;
  }
}

function formatPaymentStatus(
  status: PublicBookingLookupResponse["paymentStatus"],
): string {
  switch (status) {
    case "paid":
      return "Paid in full";
    case "partial":
      return "Partially paid";
    case "unpaid":
      return "Unpaid";
    default:
      return status;
  }
}

export function PublicBookingTrack() {
  const [code, setCode] = useState("");
  const [contact, setContact] = useState("");
  const [result, setResult] = useState<PublicBookingLookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    setIsLoading(true);

    try {
      const booking = await lookupPublicBooking(code, contact);
      setResult(booking);
    } catch (lookupError) {
      setError(
        lookupError instanceof Error
          ? lookupError.message
          : "Unable to look up booking right now.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <PublicPageHero
        eyebrow="Track booking"
        title="Find your reservation"
        description="Enter your booking reference and the phone number or email used when booking."
      />

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-4">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Booking reference</span>
              <input
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="e.g. BG-2026-0318"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none ring-emerald-500 focus:ring-2"
                required
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Phone or email</span>
              <input
                type="text"
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder="Same contact used when booking"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none ring-emerald-500 focus:ring-2"
                required
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 inline-flex w-full justify-center rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Looking up…" : "Track booking"}
          </button>
        </form>

        {error ? (
          <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </p>
        ) : null}

        {result ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <p className="text-sm uppercase tracking-[0.18em] text-emerald-800">
                Booking reference
              </p>
              <p className="mt-2 text-3xl font-semibold text-emerald-950">{result.code}</p>
              <p className="mt-2 text-sm text-emerald-800">
                {formatBookingStatus(result.status)}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Reservation details</h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Guest</dt>
                  <dd className="font-medium text-slate-900">{result.guestName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Room</dt>
                  <dd className="text-right font-medium text-slate-900">
                    {result.roomName} · Room {result.roomNumber}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Stay dates</dt>
                  <dd className="font-medium text-slate-900">
                    {formatStayDates(result.checkInDate, result.checkOutDate)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Nights</dt>
                  <dd className="font-medium text-slate-900">{result.nights}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Check-in / Check-out</dt>
                  <dd className="text-right font-medium text-slate-900">
                    {result.defaultCheckInTime} / {result.defaultCheckOutTime}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Payment</dt>
                  <dd className="font-medium text-slate-900">
                    {formatPaymentStatus(result.paymentStatus)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-slate-200 pt-4">
                  <dt className="text-base font-semibold text-slate-900">Total</dt>
                  <dd className="text-base font-semibold text-slate-900">
                    {formatPublicPrice(result.totalAmount)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
