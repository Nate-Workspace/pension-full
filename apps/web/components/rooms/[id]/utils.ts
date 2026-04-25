import type { Booking, BookingStatus, Room } from "@/data";
import { toIsoDate } from "@/lib/operations";
import type { CalendarDay } from "./types";

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

export function addUtcDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function startOfMonthUTC(year: number, monthIndex: number): Date {
  return new Date(Date.UTC(year, monthIndex, 1));
}

export function generateCalendarDays(viewMonth: Date): CalendarDay[] {
  const firstDay = startOfMonthUTC(viewMonth.getUTCFullYear(), viewMonth.getUTCMonth());
  const dayOffset = (firstDay.getUTCDay() + 6) % 7;
  const gridStart = addUtcDays(firstDay, -dayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addUtcDays(gridStart, index);
    return {
      key: toIsoDate(date),
      date,
      iso: toIsoDate(date),
      isCurrentMonth: date.getUTCMonth() === viewMonth.getUTCMonth(),
    };
  });
}

export function bookingStatusStyle(status: BookingStatus): string {
  if (status === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

export function bookingStatusLabel(status: BookingStatus): string {
  if (status === "confirmed") {
    return "Confirmed";
  }

  if (status === "pending") {
    return "Pending";
  }

  return "Cancelled";
}

export function paymentStatusStyle(status: Booking["paymentStatus"]): string {
  if (status === "paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "partial") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

export function paymentStatusLabel(status: Booking["paymentStatus"]): string {
  if (status === "paid") {
    return "Paid";
  }

  if (status === "partial") {
    return "Partial";
  }

  return "Unpaid";
}

export function roomTypeLabel(type: Room["type"]): string {
  if (type === "vip") {
    return "VIP";
  }

  return `${type.slice(0, 1).toUpperCase()}${type.slice(1)}`;
}

export function formatDate(value: string): string {
  return parseIsoDate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatMoney(value: number): string {
  return `${value.toLocaleString("en-US")} Birr`;
}

export function occursOnDay(booking: Booking, dayIso: string): boolean {
  return booking.status !== "cancelled" && dayIso >= booking.checkInDate && dayIso < booking.checkOutDate;
}

export function daysDiff(startIso: string, endIso: string): number {
  const start = parseIsoDate(startIso).getTime();
  const end = parseIsoDate(endIso).getTime();
  const dayMs = 1000 * 60 * 60 * 24;
  return Math.max(Math.round((end - start) / dayMs), 0);
}

export function computeOccupancyRate(roomBookings: Booking[]): number {
  const activeBookings = roomBookings.filter((booking) => booking.status !== "cancelled");

  if (activeBookings.length === 0) {
    return 0;
  }

  const ordered = [...activeBookings].sort((a, b) => a.checkInDate.localeCompare(b.checkInDate));
  const firstDate = ordered[0]?.checkInDate;
  const lastDate = ordered[ordered.length - 1]?.checkOutDate;

  if (!firstDate || !lastDate) {
    return 0;
  }

  const periodDays = daysDiff(firstDate, lastDate);

  if (periodDays <= 0) {
    return 0;
  }

  const occupiedDays = activeBookings.reduce((sum, booking) => {
    return sum + daysDiff(booking.checkInDate, booking.checkOutDate);
  }, 0);

  return Math.min(Math.round((occupiedDays / periodDays) * 100), 100);
}
