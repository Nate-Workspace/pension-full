"use client";

import { useMemo, useState } from "react";

import type { Booking, BookingStatus, Room } from "@/data";
import { useOperationsData } from "@/components/providers/operations-provider";
import { DataTable, MetricCard, StatusBadge } from "@/components/ui";
import { isBookingActiveOn } from "@/lib/operations";

type RoomDetailsProps = {
  roomId: string;
};

type RoomBookingRow = {
  id: string;
  code: string;
  guestName: string;
  guestPhone?: string;
  status: BookingStatus;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalAmount: number;
  paymentStatus: Booking["paymentStatus"];
  remainingAmount: number;
};

type CalendarDay = {
  key: string;
  date: Date;
  iso: string;
  isCurrentMonth: boolean;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function toIsoDate(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function addUtcDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfMonthUTC(year: number, monthIndex: number): Date {
  return new Date(Date.UTC(year, monthIndex, 1));
}

function generateCalendarDays(viewMonth: Date): CalendarDay[] {
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

function bookingStatusStyle(status: BookingStatus): string {
  if (status === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

function bookingStatusLabel(status: BookingStatus): string {
  if (status === "confirmed") {
    return "Confirmed";
  }

  if (status === "pending") {
    return "Pending";
  }

  return "Cancelled";
}

function paymentStatusStyle(status: Booking["paymentStatus"]): string {
  if (status === "paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "partial") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

function paymentStatusLabel(status: Booking["paymentStatus"]): string {
  if (status === "paid") {
    return "Paid";
  }

  if (status === "partial") {
    return "Partial";
  }

  return "Unpaid";
}

function roomTypeLabel(type: Room["type"]): string {
  if (type === "vip") {
    return "VIP";
  }

  return `${type.slice(0, 1).toUpperCase()}${type.slice(1)}`;
}

function formatDate(value: string): string {
  return parseIsoDate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatMoney(value: number): string {
  return `${value.toLocaleString("en-US")} Birr`;
}

function occursOnDay(booking: Booking, dayIso: string): boolean {
  return booking.status !== "cancelled" && dayIso >= booking.checkInDate && dayIso < booking.checkOutDate;
}

function daysDiff(startIso: string, endIso: string): number {
  const start = parseIsoDate(startIso).getTime();
  const end = parseIsoDate(endIso).getTime();
  const dayMs = 1000 * 60 * 60 * 24;
  return Math.max(Math.round((end - start) / dayMs), 0);
}

function computeOccupancyRate(roomBookings: Booking[]): number {
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

export function RoomDetails({ roomId }: RoomDetailsProps) {
  const { bookings, payments, rooms, operationDay } = useOperationsData();
  const room = useMemo(() => rooms.find((item) => item.id === roomId) ?? null, [roomId, rooms]);

  const [viewMonth, setViewMonth] = useState<Date>(() => {
    if (!room) {
      return new Date(Date.UTC(2026, 2, 1));
    }

    const roomBookings = bookings.filter((booking) => booking.roomId === room.id);
    const firstBooking = [...roomBookings].sort((a, b) => a.checkInDate.localeCompare(b.checkInDate))[0];
    if (!firstBooking) {
      return new Date(Date.UTC(2026, 2, 1));
    }

    const firstDate = parseIsoDate(firstBooking.checkInDate);
    return startOfMonthUTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth());
  });

  const roomBookings = useMemo(() => {
    if (!room) {
      return [];
    }

    return bookings
      .filter((booking) => booking.roomId === room.id)
      .sort((left, right) => right.checkInDate.localeCompare(left.checkInDate));
  }, [bookings, room]);

  const bookingRows = useMemo<RoomBookingRow[]>(() => {
    return roomBookings.map((booking) => {
      return {
        id: booking.id,
        code: booking.code,
        guestName: booking.guest.name,
        guestPhone: booking.guest.phone,
        status: booking.status,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        nights: booking.nights,
        totalAmount: booking.totalAmount,
        paymentStatus: booking.paymentStatus,
        remainingAmount: booking.remainingAmount,
      };
    });
  }, [roomBookings]);

  const activeBooking = useMemo(() => {
    return roomBookings.find((booking) => isBookingActiveOn(operationDay, booking)) ?? null;
  }, [operationDay, roomBookings]);

  const roomPayments = useMemo(() => {
    if (!room) {
      return [];
    }

    return payments.filter((payment) => payment.roomId === room.id);
  }, [payments, room]);

  const analytics = useMemo(() => {
    const nonCancelled = roomBookings.filter((booking) => booking.status !== "cancelled");

    return {
      bookingCount: roomBookings.length,
      occupancyRate: computeOccupancyRate(roomBookings),
      revenueGenerated: nonCancelled.reduce((sum, booking) => sum + booking.totalAmount, 0),
      collectedRevenue: roomPayments.reduce((sum, payment) => sum + payment.amount, 0),
    };
  }, [roomBookings, roomPayments]);

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

  if (!room) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <p className="text-base font-semibold text-slate-900">Room not found</p>
        <p className="mt-1 text-sm text-slate-500">The selected room does not exist in the current dataset.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{room.name} Details</h1>
        <p className="mt-1 text-sm text-slate-500">Room profile, reservation history, and performance analytics.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Booking Count" value={String(analytics.bookingCount)} description="All-time records" />
        <MetricCard
          title="Occupancy Rate"
          value={`${analytics.occupancyRate}%`}
          description="Based on booked nights window"
        />
        <MetricCard title="Revenue Generated" value={formatMoney(analytics.revenueGenerated)} />
        <MetricCard title="Collected Revenue" value={formatMoney(analytics.collectedRevenue)} description="Paid amounts" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Room Information</h2>
            <StatusBadge status={room.status} />
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Room Name</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{room.name}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Room Number</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{room.number}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{roomTypeLabel(room.type)}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Floor</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{room.floor}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Capacity</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{room.capacity} guest(s)</dd>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price / Night</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{formatMoney(room.pricePerNight)}</dd>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Guest</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">
                {activeBooking ? activeBooking.guest.name : "No active booking"}
              </dd>
            </div>
            {room.assignedTo ? (
              <div className="rounded-lg border border-slate-200 p-3 sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned To</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{room.assignedTo}</dd>
              </div>
            ) : null}
          </dl>
        </div>

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
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-slate-900">Room Bookings</h2>
          <p className="text-sm text-slate-500">All bookings associated with this room.</p>
        </div>

        <DataTable<RoomBookingRow>
          columns={[
            {
              key: "booking",
              header: "Booking",
              render: (row) => (
                <div>
                  <p className="font-medium text-slate-900">{row.code}</p>
                  <p className="text-xs text-slate-500">
                    {row.guestName}
                    {row.guestPhone ? ` • ${row.guestPhone}` : ""}
                  </p>
                </div>
              ),
            },
            {
              key: "stay",
              header: "Stay",
              render: (row) => (
                <span className="text-xs text-slate-600">
                  {formatDate(row.checkInDate)} - {formatDate(row.checkOutDate)}
                </span>
              ),
            },
            {
              key: "nights",
              header: "Nights",
              align: "center",
              render: (row) => row.nights,
            },
            {
              key: "status",
              header: "Booking Status",
              render: (row) => (
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${bookingStatusStyle(row.status)}`}
                >
                  {bookingStatusLabel(row.status)}
                </span>
              ),
            },
            {
              key: "payment",
              header: "Payment",
              render: (row) => (
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentStatusStyle(row.paymentStatus)}`}
                >
                  {paymentStatusLabel(row.paymentStatus)}
                </span>
              ),
            },
            {
              key: "amount",
              header: "Total",
              align: "right",
              render: (row) => formatMoney(row.totalAmount),
            },
            {
              key: "remaining",
              header: "Remaining",
              align: "right",
              render: (row) => formatMoney(row.remainingAmount),
            },
          ]}
          data={bookingRows}
          getRowKey={(row) => row.id}
          emptyTitle="No bookings for this room"
          emptyDescription="Create a booking to start tracking this room's timeline."
        />
      </section>
    </div>
  );
}
