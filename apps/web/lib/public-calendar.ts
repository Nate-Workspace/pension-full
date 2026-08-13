import { toIsoDate } from "@/lib/operations";

import type { PublicBookedRange } from "@repo/contracts";

export {
  addUtcDays,
  formatMonthLabel,
  generateCalendarDays,
  startOfMonthUTC,
  WEEKDAYS,
} from "@/components/rooms/[id]/utils";

export function getCalendarQueryRange(viewMonth: Date): { from: string; to: string } {
  const firstDay = new Date(
    Date.UTC(viewMonth.getUTCFullYear(), viewMonth.getUTCMonth(), 1),
  );
  const dayOffset = (firstDay.getUTCDay() + 6) % 7;
  const gridStart = new Date(firstDay);
  gridStart.setUTCDate(gridStart.getUTCDate() - dayOffset);
  const gridEnd = new Date(gridStart);
  gridEnd.setUTCDate(gridEnd.getUTCDate() + 42);

  return {
    from: toIsoDate(gridStart),
    to: toIsoDate(gridEnd),
  };
}

export function getTodayIsoDate(): string {
  return toIsoDate(new Date());
}

export function isDayBooked(iso: string, bookedRanges: PublicBookedRange[]): boolean {
  return bookedRanges.some(
    (range) => iso >= range.checkInDate && iso < range.checkOutDate,
  );
}

export function isDayInSelectedRange(
  iso: string,
  checkInDate: string | null,
  checkOutDate: string | null,
): boolean {
  if (!checkInDate) {
    return false;
  }

  if (!checkOutDate) {
    return iso === checkInDate;
  }

  return iso >= checkInDate && iso < checkOutDate;
}

export function doesRangeOverlapBooked(
  checkInDate: string,
  checkOutDate: string,
  bookedRanges: PublicBookedRange[],
): boolean {
  return bookedRanges.some(
    (range) => checkInDate < range.checkOutDate && checkOutDate > range.checkInDate,
  );
}

export function isValidBookingRange(
  checkInDate: string,
  checkOutDate: string,
  bookedRanges: PublicBookedRange[],
  todayIso: string,
): boolean {
  if (checkOutDate <= checkInDate) {
    return false;
  }

  if (checkInDate < todayIso) {
    return false;
  }

  return !doesRangeOverlapBooked(checkInDate, checkOutDate, bookedRanges);
}

export function formatStayDates(checkInDate: string, checkOutDate: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  const checkIn = formatter.format(new Date(`${checkInDate}T00:00:00Z`));
  const checkOut = formatter.format(new Date(`${checkOutDate}T00:00:00Z`));

  return `${checkIn} → ${checkOut}`;
}

export function countNights(checkInDate: string, checkOutDate: string): number {
  const start = new Date(`${checkInDate}T00:00:00Z`).getTime();
  const end = new Date(`${checkOutDate}T00:00:00Z`).getTime();
  const dayMs = 1000 * 60 * 60 * 24;
  return Math.max(Math.round((end - start) / dayMs), 0);
}
