import type { Booking } from "@/data";
import type { CalendarDay } from "../types";
import { bookingStatusLabel, bookingStatusStyle, formatMonthLabel, startOfMonthUTC, WEEKDAYS } from "../utils";

type RoomCalendarCardProps = {
  viewMonth: Date;
  setViewMonth: React.Dispatch<React.SetStateAction<Date>>;
  calendarDays: CalendarDay[];
  reservationsByDay: Map<string, Booking[]>;
};

export function RoomCalendarCard({
  viewMonth,
  setViewMonth,
  calendarDays,
  reservationsByDay,
}: RoomCalendarCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Reservation Calendar</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setViewMonth((current) => startOfMonthUTC(current.getUTCFullYear(), current.getUTCMonth() - 1))
            }
            className="h-8 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Prev
          </button>
          <p className="min-w-28 text-center text-xs font-semibold text-slate-700">{formatMonthLabel(viewMonth)}</p>
          <button
            type="button"
            onClick={() =>
              setViewMonth((current) => startOfMonthUTC(current.getUTCFullYear(), current.getUTCMonth() + 1))
            }
            className="h-8 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((weekday) => (
          <div
            key={`weekday-${weekday}`}
            className="rounded-md bg-slate-100 py-1.5 text-center text-[11px] font-semibold text-slate-600"
          >
            {weekday}
          </div>
        ))}

        {calendarDays.map((day) => {
          const dayBookings = reservationsByDay.get(day.iso) ?? [];

          return (
            <div
              key={day.key}
              className={`min-h-20 rounded-md border p-1.5 ${
                day.isCurrentMonth ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50"
              }`}
            >
              <p className="text-[11px] font-semibold text-slate-700">{day.date.getUTCDate()}</p>
              <div className="mt-1 space-y-1">
                {dayBookings.slice(0, 2).map((booking) => (
                  <div
                    key={`${day.key}-${booking.id}`}
                    className={`truncate rounded border px-1 py-0.5 text-[10px] font-medium ${bookingStatusStyle(
                      booking.status,
                    )}`}
                    title={`${booking.guest.name} (${bookingStatusLabel(booking.status)})`}
                  >
                    {booking.guest.name}
                  </div>
                ))}
                {dayBookings.length > 2 ? (
                  <p className="text-[10px] font-medium text-slate-500">+{dayBookings.length - 2} more</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
