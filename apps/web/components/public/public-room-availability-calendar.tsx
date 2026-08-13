"use client";

import type { PublicRoomBookingCalendarState } from "./hooks/use-public-room-booking-calendar";
import {
  formatMonthLabel,
  isDayBooked,
  isDayInSelectedRange,
  startOfMonthUTC,
  WEEKDAYS,
} from "@/lib/public-calendar";

type PublicRoomAvailabilityCalendarProps = {
  calendar: PublicRoomBookingCalendarState;
};

export function PublicRoomAvailabilityCalendar({
  calendar,
}: PublicRoomAvailabilityCalendarProps) {
  const {
    viewMonth,
    setViewMonth,
    calendarDays,
    bookedRanges,
    isLoading,
    loadError,
    selectedCheckIn,
    selectedCheckOut,
    selectDay,
    todayIso,
  } = calendar;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Availability</h2>
          <p className="mt-1 text-sm text-slate-600">
            Select check-in and check-out dates. Booked nights are shown without guest
            details.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setViewMonth((current) =>
                startOfMonthUTC(
                  current.getUTCFullYear(),
                  current.getUTCMonth() - 1,
                ),
              )
            }
            className="rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Prev
          </button>
          <p className="min-w-32 text-center text-sm font-semibold text-slate-700">
            {formatMonthLabel(viewMonth)}
          </p>
          <button
            type="button"
            onClick={() =>
              setViewMonth((current) =>
                startOfMonthUTC(
                  current.getUTCFullYear(),
                  current.getUTCMonth() + 1,
                ),
              )
            }
            className="rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-100 ring-1 ring-emerald-300" />
          Available
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-300" />
          Booked
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-900" />
          Selected
        </span>
        {isLoading ? <span className="text-slate-500">Updating…</span> : null}
      </div>

      {loadError ? (
        <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {loadError}
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="rounded-lg bg-slate-100 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-600"
          >
            {weekday}
          </div>
        ))}

        {calendarDays.map((day) => {
          const booked = isDayBooked(day.iso, bookedRanges);
          const isPast = day.iso < todayIso;
          const isSelected = isDayInSelectedRange(
            day.iso,
            selectedCheckIn,
            selectedCheckOut,
          );
          const isDisabled = booked || isPast;
          const isCheckIn = selectedCheckIn === day.iso;
          const isCheckOut = selectedCheckOut === day.iso;

          return (
            <button
              key={day.key}
              type="button"
              disabled={isDisabled}
              onClick={() => selectDay(day.iso)}
              className={`min-h-[4.5rem] rounded-xl border p-2 text-left transition ${
                !day.isCurrentMonth
                  ? "border-slate-100 bg-slate-50/80"
                  : isSelected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : booked
                      ? "border-slate-200 bg-slate-100 text-slate-500"
                      : isPast
                        ? "border-slate-100 bg-slate-50 text-slate-400"
                        : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50"
              } ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
              aria-label={
                booked
                  ? `${day.iso}, booked`
                  : isPast
                    ? `${day.iso}, unavailable`
                    : `${day.iso}, available`
              }
            >
              <span className="text-[11px] font-semibold">{day.date.getUTCDate()}</span>
              {booked ? (
                <span className="mt-2 block text-[10px] font-medium uppercase tracking-wide">
                  Booked
                </span>
              ) : isCheckIn ? (
                <span className="mt-2 block text-[10px] font-medium uppercase tracking-wide">
                  Check-in
                </span>
              ) : isCheckOut ? (
                <span className="mt-2 block text-[10px] font-medium uppercase tracking-wide">
                  Check-out
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
