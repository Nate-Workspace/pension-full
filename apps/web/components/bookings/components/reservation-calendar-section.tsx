import { bookingStatusStyle, WEEKDAYS, type CalendarDay, type CalendarReservation } from "../hooks/use-bookings-management";

type Props = {
  viewMonth: Date;
  calendarDays: CalendarDay[];
  reservationsByDay: Map<string, CalendarReservation[]>;
  getMonthLabel: (value: Date) => string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

export function ReservationCalendarSection({
  viewMonth,
  calendarDays,
  reservationsByDay,
  getMonthLabel,
  onPrevMonth,
  onNextMonth,
}: Props) {
  return (
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

      <div className="grid grid-cols-7 gap-2">
        {WEEKDAYS.map((label) => (
          <div key={label} className="rounded-md bg-slate-100 py-2 text-center text-xs font-semibold text-slate-600">
            {label}
          </div>
        ))}

        {calendarDays.map((day) => {
          const dayReservations = reservationsByDay.get(day.iso) ?? [];

          return (
            <div
              key={day.key}
              className={`min-h-24 rounded-lg border p-2 ${
                day.isCurrentMonth ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 text-slate-400"
              }`}
            >
              <p className="text-xs font-semibold">{day.date.getUTCDate()}</p>
              <div className="mt-1 space-y-1">
                {dayReservations.slice(0, 2).map((reservation) => (
                  <div
                    key={`${day.key}-${reservation.id}`}
                    className={`truncate rounded border px-1.5 py-0.5 text-[10px] font-medium ${bookingStatusStyle(
                      reservation.status,
                    )}`}
                    title={`${reservation.guestName} - Room ${reservation.roomNumber}`}
                  >
                    {reservation.guestName} - R{reservation.roomNumber}
                  </div>
                ))}
                {dayReservations.length > 2 ? (
                  <p className="text-[10px] font-medium text-slate-500">+{dayReservations.length - 2} more</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
