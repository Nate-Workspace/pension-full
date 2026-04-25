import { useMemo, useState } from "react";
import type { Booking } from "@/data";
import { generateCalendarDays, occursOnDay, startOfMonthUTC } from "../utils";

export function useRoomCalendar(roomBookings: Booking[]) {
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const now = new Date();
    return startOfMonthUTC(now.getUTCFullYear(), now.getUTCMonth());
  });

  const calendarDays = useMemo(() => generateCalendarDays(viewMonth), [viewMonth]);

  const reservationsByDay = useMemo(() => {
    const entries = new Map<string, Booking[]>();

    roomBookings.forEach((booking) => {
      calendarDays.forEach((day) => {
        if (!occursOnDay(booking, day.iso)) {
          return;
        }

        const existing = entries.get(day.iso) ?? [];
        entries.set(day.iso, [...existing, booking]);
      });
    });

    return entries;
  }, [calendarDays, roomBookings]);

  return {
    viewMonth,
    setViewMonth,
    calendarDays,
    reservationsByDay,
  };
}
