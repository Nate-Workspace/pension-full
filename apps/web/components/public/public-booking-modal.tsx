"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";

import type {
  PublicPensionResponse,
  PublicRoomResponse,
  SiteContentResponse,
} from "@repo/contracts";

import { checkoutPublicBooking } from "@/lib/public-booking-service";
import { countNights, formatStayDates } from "@/lib/public-calendar";
import { formatPublicPrice } from "@/lib/public-content";

export type PublicBookingDraft = {
  checkInDate: string;
  checkOutDate: string;
};

type GuestFormState = {
  guestName: string;
  guestPhone: string;
  guestEmail: string;
};

type GuestFormErrors = Partial<Record<keyof GuestFormState, string>>;

type BookingModalStep = "review" | "payment";

type PublicBookingModalProps = {
  open: boolean;
  onClose: () => void;
  room: PublicRoomResponse;
  pension: PublicPensionResponse;
  siteContent: SiteContentResponse;
  booking: PublicBookingDraft;
};

function validateGuestForm(form: GuestFormState): GuestFormErrors {
  const errors: GuestFormErrors = {};

  if (!form.guestName.trim()) {
    errors.guestName = "Guest name is required.";
  }

  if (!form.guestPhone.trim() && !form.guestEmail.trim()) {
    errors.guestPhone = "Provide a phone number or email address.";
  }

  if (form.guestEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guestEmail.trim())) {
    errors.guestEmail = "Enter a valid email address.";
  }

  return errors;
}

export function PublicBookingModal({
  open,
  onClose,
  room,
  pension,
  siteContent,
  booking,
}: PublicBookingModalProps) {
  const router = useRouter();
  const titleId = useId();
  const [step, setStep] = useState<BookingModalStep>("review");
  const [guestForm, setGuestForm] = useState<GuestFormState>({
    guestName: "",
    guestPhone: "",
    guestEmail: "",
  });
  const [guestErrors, setGuestErrors] = useState<GuestFormErrors>({});
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  const nights = countNights(booking.checkInDate, booking.checkOutDate);
  const totalAmount = nights * room.pricePerNight;
  const cancellationPolicy =
    siteContent.config.cancellationPolicy.trim() ||
    "Cancellation terms will be shared during check-in.";

  const isGuestFormValid = useMemo(
    () => Object.keys(validateGuestForm(guestForm)).length === 0,
    [guestForm],
  );

  useEffect(() => {
    if (!open) {
      setStep("review");
      setGuestErrors({});
      setCheckoutError(null);
      setIsPaying(false);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPaying) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, isPaying]);

  if (!open) {
    return null;
  }

  const handleFieldChange = (field: keyof GuestFormState, value: string) => {
    setGuestForm((current) => ({ ...current, [field]: value }));
    setGuestErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleContinueToPayment = () => {
    const errors = validateGuestForm(guestForm);
    setGuestErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setCheckoutError(null);
    setStep("payment");
  };

  const handlePayNow = async () => {
    setCheckoutError(null);
    setIsPaying(true);

    try {
      const result = await checkoutPublicBooking({
        roomId: room.id,
        guestName: guestForm.guestName.trim(),
        guestPhone: guestForm.guestPhone.trim() || undefined,
        guestEmail: guestForm.guestEmail.trim() || undefined,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
      });

      sessionStorage.setItem(
        `public-booking-confirmation:${result.code}`,
        JSON.stringify(result),
      );

      router.push(`/booking/confirmation/${encodeURIComponent(result.code)}`);
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "Payment could not be completed.",
      );
      setIsPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close booking modal"
        onClick={onClose}
        disabled={isPaying}
        className="absolute inset-0 bg-slate-950/60 disabled:cursor-not-allowed"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">
                {step === "review" ? "Review your stay" : "Payment summary"}
              </p>
              <h2 id={titleId} className="mt-1 text-xl font-semibold text-slate-900">
                {room.name}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Room {room.number} · {formatStayDates(booking.checkInDate, booking.checkOutDate)}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isPaying}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Close
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {step === "review" ? (
            <>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Pricing breakdown
                </h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-600">
                      {formatPublicPrice(room.pricePerNight)} × {nights}{" "}
                      {nights === 1 ? "night" : "nights"}
                    </dt>
                    <dd className="font-medium text-slate-900">
                      {formatPublicPrice(totalAmount)}
                    </dd>
                  </div>
                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-base font-semibold text-slate-900">Total</dt>
                      <dd className="text-base font-semibold text-slate-900">
                        {formatPublicPrice(totalAmount)}
                      </dd>
                    </div>
                  </div>
                </dl>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Check-in</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {booking.checkInDate} at {pension.defaultCheckInTime}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Check-out</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {booking.checkOutDate} at {pension.defaultCheckOutTime}
                  </p>
                </div>
              </div>

              <form
                className="mt-5 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleContinueToPayment();
                }}
              >
                <h3 className="text-sm font-semibold text-slate-900">Guest details</h3>

                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Full name</span>
                  <input
                    type="text"
                    value={guestForm.guestName}
                    onChange={(event) => handleFieldChange("guestName", event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none ring-emerald-500 focus:ring-2"
                    autoComplete="name"
                  />
                  {guestErrors.guestName ? (
                    <span className="mt-1 block text-xs text-rose-600">
                      {guestErrors.guestName}
                    </span>
                  ) : null}
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">Phone</span>
                    <input
                      type="tel"
                      value={guestForm.guestPhone}
                      onChange={(event) => handleFieldChange("guestPhone", event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none ring-emerald-500 focus:ring-2"
                      autoComplete="tel"
                    />
                    {guestErrors.guestPhone ? (
                      <span className="mt-1 block text-xs text-rose-600">
                        {guestErrors.guestPhone}
                      </span>
                    ) : null}
                  </label>

                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">Email</span>
                    <input
                      type="email"
                      value={guestForm.guestEmail}
                      onChange={(event) => handleFieldChange("guestEmail", event.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none ring-emerald-500 focus:ring-2"
                      autoComplete="email"
                    />
                    {guestErrors.guestEmail ? (
                      <span className="mt-1 block text-xs text-rose-600">
                        {guestErrors.guestEmail}
                      </span>
                    ) : null}
                  </label>
                </div>
              </form>

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <h3 className="text-sm font-semibold text-amber-950">Cancellation policy</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-amber-900">
                  {cancellationPolicy}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Payment summary
                </h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-600">Guest</dt>
                    <dd className="font-medium text-slate-900">{guestForm.guestName.trim()}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-600">Stay</dt>
                    <dd className="text-right font-medium text-slate-900">
                      {nights} {nights === 1 ? "night" : "nights"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-600">Rate per night</dt>
                    <dd className="font-medium text-slate-900">
                      {formatPublicPrice(room.pricePerNight)}
                    </dd>
                  </div>
                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex justify-between gap-4">
                      <dt className="text-base font-semibold text-slate-900">Total due now</dt>
                      <dd className="text-base font-semibold text-slate-900">
                        {formatPublicPrice(totalAmount)}
                      </dd>
                    </div>
                  </div>
                </dl>
              </div>

              <p className="mt-4 text-sm text-slate-600">
                Simulated payment — no external provider. Your booking will be confirmed
                immediately after Pay now.
              </p>

              {checkoutError ? (
                <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {checkoutError}
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
          {step === "review" ? (
            <button
              type="button"
              onClick={handleContinueToPayment}
              disabled={!isGuestFormValid}
              className={`inline-flex w-full justify-center rounded-full px-4 py-3 text-sm font-semibold transition ${
                isGuestFormValid
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "cursor-not-allowed bg-slate-200 text-slate-500"
              }`}
            >
              Continue to payment
            </button>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep("review")}
                disabled={isPaying}
                className="inline-flex flex-1 justify-center rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => void handlePayNow()}
                disabled={isPaying}
                className="inline-flex flex-1 justify-center rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPaying ? "Processing…" : "Pay now"}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export type { GuestFormState };
