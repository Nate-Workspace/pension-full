import { useMemo, useState } from "react";
import {
  bookingStatusLabel,
  WEEKDAYS,
  formatDate,
  type CalendarDay,
  type CalendarReservation,
} from "../hooks/use-bookings-management";

type Props = {
  viewMonth: Date;
  calendarDays: CalendarDay[];
  reservationsByDay: Map<string, CalendarReservation[]>;
  getMonthLabel: (value: Date) => string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

function getStatusDotClass(status: CalendarReservation["status"]): string {
  if (status === "active") {
    return "bg-emerald-500";
  }

  if (status === "upcoming") {
    return "bg-blue-500";
  }

  if (status === "checked_out") {
    return "bg-slate-500";
  }

  return "bg-rose-500";
}

export function ReservationCalendarSection({
  viewMonth,
  calendarDays,
  reservationsByDay,
  getMonthLabel,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);

  const selectedDayReservations = useMemo(
    () => (selectedDayIso ? reservationsByDay.get(selectedDayIso) ?? [] : []),
    [reservationsByDay, selectedDayIso],
  );

  return (
    <>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Reservation Calendar</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrevMonth}
              className="h-9 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Prev
            </button>
            <p className="min-w-32 text-center text-sm font-semibold text-slate-800">{getMonthLabel(viewMonth)}</p>
            <button
              type="button"
              onClick={onNextMonth}
              className="h-9 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Next
            </button>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Active</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" />Upcoming</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-500" />Checked Out</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" />Canceled</span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {WEEKDAYS.map((label) => (
            <div key={label} className="rounded-md bg-slate-100 py-2 text-center text-xs font-semibold text-slate-600">
              {label}
            </div>
          ))}

          {calendarDays.map((day) => {
            const dayReservations = reservationsByDay.get(day.iso) ?? [];
            const visibleReservations = dayReservations.slice(0, 3);
            const overflowCount = dayReservations.length - visibleReservations.length;

            return (
              <button
                key={day.key}
                type="button"
                onClick={() => setSelectedDayIso(day.iso)}
                className={`min-h-24 rounded-lg border p-2 text-left transition ${
                  day.isCurrentMonth
                    ? "border-slate-200 bg-white hover:border-slate-300"
                    : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                }`}
              >
                <p className="text-xs font-semibold">{day.date.getUTCDate()}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {visibleReservations.map((reservation) => (
                    <span
                      key={`${day.key}-${reservation.id}`}
                      className={`h-2.5 w-2.5 rounded-full ${getStatusDotClass(reservation.status)}`}
                      title={`${bookingStatusLabel(reservation.status)} - ${reservation.guestName} (Room ${reservation.roomNumber})`}
                    />
                  ))}
                </div>
                {overflowCount > 0 ? (
                  <p className="mt-2 text-[10px] font-medium text-slate-500">+{overflowCount} more</p>
                ) : null}
                {dayReservations.length === 0 ? (
                  <p className="mt-2 text-[10px] text-slate-400">No bookings</p>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      {selectedDayIso ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Bookings on {formatDate(selectedDayIso)}</h3>
                <p className="text-sm text-slate-500">{selectedDayReservations.length} reservation(s)</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayIso(null)}
                className="h-8 rounded-md border border-slate-200 px-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            {selectedDayReservations.length === 0 ? (
              <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">No bookings for this day.</p>
            ) : (
              <div className="max-h-72 space-y-2 overflow-auto pr-1">
                {selectedDayReservations.map((reservation) => (
                  <div key={reservation.id} className="rounded-md border border-slate-200 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{reservation.guestName}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                        <span className={`h-2 w-2 rounded-full ${getStatusDotClass(reservation.status)}`} />
                        {bookingStatusLabel(reservation.status)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600">Room {reservation.roomNumber}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Stay: {formatDate(reservation.checkInDate)} - {formatDate(reservation.checkOutDate)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
