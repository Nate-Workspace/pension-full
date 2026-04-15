"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";

import type { Booking, BookingStatus, Room } from "@/data";
import { useOperationsData } from "@/components/providers/operations-provider";
import { DataTable, FormSurface, MetricCard } from "@/components/ui";
import {
  derivePaymentStatus,
  diffNights,
  isBookingActiveOn,
  overlapsRange,
  parseIsoDate,
  toIsoDate,
} from "@/lib/operations";

type BookingFilter = "all" | BookingStatus;

type BookingFormState = {
  id?: string;
  guestName: string;
  guestPhone: string;
  guestIdNumber: string;
  handledBy: string;
  roomId: string;
  status: BookingStatus;
  checkInDate: string;
  checkOutDate: string;
  paidAmount: string;
  source: Booking["source"];
};

type CalendarDay = {
  key: string;
  date: Date;
  iso: string;
  isCurrentMonth: boolean;
};

type CalendarReservation = {
  id: string;
  guestName: string;
  roomNumber: string;
  status: BookingStatus;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function formatDate(value: string): string {
  return parseIsoDate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(value: number): string {
  return `${value.toLocaleString("en-US")} Birr`;
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

function bookingStatusStyle(status: BookingStatus): string {
  if (status === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

function createFormDefaults(roomList: Room[]): BookingFormState {
  return {
    guestName: "",
    guestPhone: "",
    guestIdNumber: "",
    handledBy: "",
    roomId: roomList[0]?.id ?? "",
    status: "confirmed",
    checkInDate: "2026-03-27",
    checkOutDate: "2026-03-29",
    paidAmount: "0",
    source: "walk-in",
  };
}

function createFormFromBooking(booking: Booking): BookingFormState {
  return {
    id: booking.id,
    guestName: booking.guest.name,
    guestPhone: booking.guest.phone ?? "",
    guestIdNumber: booking.guest.idNumber ?? "",
    handledBy: booking.handledBy ?? "",
    roomId: booking.roomId,
    status: booking.status,
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    paidAmount: String(booking.paidAmount),
    source: booking.source,
  };
}

function createBookingCode(index: number): string {
  return `BG-2026-AUTO-${String(index).padStart(3, "0")}`;
}

function getMonthLabel(currentMonth: Date): string {
  return currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function startOfMonthUTC(year: number, monthIndex: number): Date {
  return new Date(Date.UTC(year, monthIndex, 1));
}

function addUtcDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
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

function occursOnDay(booking: Booking, dayIso: string): boolean {
  return dayIso >= booking.checkInDate && dayIso < booking.checkOutDate;
}

function byId<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

export function BookingsManagement() {
  const { bookings, rooms, operationDay, setBookings, setCleaningRoomIds } = useOperationsData();
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingFilter>("all");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState<BookingFormState>(() => createFormDefaults(rooms));
  const [formError, setFormError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [viewMonth, setViewMonth] = useState<Date>(() => new Date(Date.UTC(2026, 2, 1)));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, 450);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const roomById = useMemo(() => byId<Room>(rooms), [rooms]);

  const visibleBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      if (statusFilter !== "all" && booking.status !== statusFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const room = roomById.get(booking.roomId);

      const guestName = booking.guest.name.toLowerCase();
      const roomLabel = room ? `room ${room.number}`.toLowerCase() : "";

      return (
        booking.code.toLowerCase().includes(query) ||
        guestName.includes(query) ||
        roomLabel.includes(query)
      );
    });
  }, [bookings, roomById, search, statusFilter]);

  const metrics = useMemo(() => {
    const confirmed = bookings.filter((booking) => booking.status === "confirmed").length;
    const pending = bookings.filter((booking) => booking.status === "pending").length;
    const cancelled = bookings.filter((booking) => booking.status === "cancelled").length;
    const monthRevenue = bookings
      .filter((booking) => booking.status === "confirmed" && booking.checkInDate.startsWith("2026-03"))
      .reduce((sum, booking) => sum + booking.totalAmount, 0);

    return {
      total: bookings.length,
      confirmed,
      pending,
      cancelled,
      monthRevenue,
    };
  }, [bookings]);

  const calendarDays = useMemo(() => generateCalendarDays(viewMonth), [viewMonth]);

  const reservationsByDay = useMemo(() => {
    const map = new Map<string, CalendarReservation[]>();

    bookings.forEach((booking) => {
      if (booking.status === "cancelled") {
        return;
      }

      calendarDays.forEach((day) => {
        if (!occursOnDay(booking, day.iso)) {
          return;
        }

        const room = roomById.get(booking.roomId);

        const entry: CalendarReservation = {
          id: booking.id,
          guestName: booking.guest.name,
          roomNumber: room?.number ?? "N/A",
          status: booking.status,
        };

        const current = map.get(day.iso) ?? [];
        map.set(day.iso, [...current, entry]);
      });
    });

    return map;
  }, [bookings, calendarDays, roomById]);

  const openCreate = () => {
    setFormError(null);
    setActionMessage(null);
    setFormState(createFormDefaults(rooms));
    setIsFormOpen(true);
  };

  const openEdit = (booking: Booking) => {
    setFormError(null);
    setActionMessage(null);
    setFormState(createFormFromBooking(booking));
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormError(null);
    setActionMessage(null);
  };

  const checkoutBooking = (bookingId: string) => {
    const booking = bookings.find((item) => item.id === bookingId);

    if (!booking) {
      return;
    }

    if (booking.status === "cancelled") {
      setActionMessage("Cancelled bookings cannot be checked out.");
      return;
    }

    if (booking.remainingAmount > 0) {
      const shouldProceed = window.confirm(
        `This booking has an unpaid balance of ${formatMoney(booking.remainingAmount)}. Continue checkout?`,
      );

      if (!shouldProceed) {
        return;
      }
    }

    const today = operationDay;
    const updatedNights = Math.max(1, diffNights(booking.checkInDate, today));

    setBookings((current) =>
      current.map((item) => {
        if (item.id !== bookingId) {
          return item;
        }

        return {
          ...item,
          checkOut: today,
          checkOutDate: today,
          nights: updatedNights,
        };
      }),
    );

    setCleaningRoomIds((current) => {
      const next = new Set(current);
      next.add(booking.roomId);
      return next;
    });

    setActionMessage(`Booking ${booking.code} checked out. Room moved to cleaning.`);
  };

  const setRoomAvailable = (roomId: string) => {
    if (bookings.some((booking) => booking.roomId === roomId && isBookingActiveOn(operationDay, booking))) {
      setActionMessage("Room cannot be set to available while an active booking exists.");
      return;
    }

    setCleaningRoomIds((current) => {
      const next = new Set(current);
      next.delete(roomId);
      return next;
    });

    setActionMessage("Room marked as available.");
  };

  const saveBooking = () => {
    const nights = diffNights(formState.checkInDate, formState.checkOutDate);

    if (nights <= 0) {
      setFormError("Check-out date must be after check-in date.");
      return;
    }

    const room = roomById.get(formState.roomId);

    if (!room) {
      setFormError("Selected room is invalid.");
      return;
    }

    const parsedPaidAmount = Number(formState.paidAmount);

    if (!formState.guestName.trim()) {
      setFormError("Guest name is required.");
      return;
    }

    if (!Number.isFinite(parsedPaidAmount) || parsedPaidAmount < 0) {
      setFormError("Paid amount must be a valid non-negative number.");
      return;
    }

    const overlapBooking = bookings.find(
      (booking) =>
        booking.id !== formState.id &&
        booking.roomId === formState.roomId &&
        booking.status !== "cancelled" &&
        formState.status !== "cancelled" &&
        overlapsRange(
          formState.checkInDate,
          formState.checkOutDate,
          booking.checkInDate,
          booking.checkOutDate,
        ),
    );

    if (overlapBooking) {
      setFormError(`Room already booked in this period (${overlapBooking.code}).`);
      return;
    }

    const nextAmount = room.pricePerNight * nights;
    const boundedPaidAmount = Math.min(parsedPaidAmount, nextAmount);
    const remainingAmount = Math.max(nextAmount - boundedPaidAmount, 0);
    const paymentStatus = derivePaymentStatus(nextAmount, boundedPaidAmount);

    const nextBooking: Booking = {
      id: formState.id ?? `book-local-${bookings.length + 1}`,
      code: formState.id
        ? bookings.find((item) => item.id === formState.id)?.code ?? createBookingCode(bookings.length + 1)
        : createBookingCode(bookings.length + 1),
      guest: {
        name: formState.guestName.trim(),
        phone: formState.guestPhone.trim() || undefined,
        idNumber: formState.guestIdNumber.trim() || undefined,
      },
      handledBy: formState.handledBy.trim() || undefined,
      roomId: formState.roomId,
      status: formState.status,
      checkIn: formState.checkInDate,
      checkOut: formState.checkOutDate,
      checkInDate: formState.checkInDate,
      checkOutDate: formState.checkOutDate,
      nights,
      totalAmount: nextAmount,
      paidAmount: boundedPaidAmount,
      remainingAmount,
      paymentStatus,
      dueDate: remainingAmount > 0 ? formState.checkOutDate : undefined,
      createdAt:
        formState.id
          ? bookings.find((item) => item.id === formState.id)?.createdAt ?? `${formState.checkInDate}T09:00:00Z`
          : `${formState.checkInDate}T09:00:00Z`,
      source: formState.source,
    };

    setBookings((current) => {
      if (!formState.id) {
        return [nextBooking, ...current];
      }

      return current.map((item) => (item.id === formState.id ? nextBooking : item));
    });

    if (formState.status !== "cancelled") {
      setCleaningRoomIds((current) => {
        const next = new Set(current);
        next.delete(formState.roomId);
        return next;
      });
    }

    setIsFormOpen(false);
    setFormError(null);
    setActionMessage("Booking saved successfully.");
  };

  const cancelBooking = (bookingId: string) => {
    setBookings((current) =>
      current.map((booking) => {
        if (booking.id !== bookingId) {
          return booking;
        }

        return {
          ...booking,
          status: "cancelled",
        };
      }),
    );
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Booking Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track reservation lifecycle, manage changes, and monitor availability in calendar view.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
        >
          Create Booking
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total Bookings" value={String(metrics.total)} />
        <MetricCard title="Confirmed" value={String(metrics.confirmed)} />
        <MetricCard title="Pending" value={String(metrics.pending)} />
        <MetricCard title="Cancelled" value={String(metrics.cancelled)} />
        <MetricCard title="Booked Revenue" value={formatMoney(metrics.monthRevenue)} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by code, guest, room"
            className="h-10 w-full max-w-sm rounded-md border border-slate-200 px-3 text-sm text-slate-700"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as BookingFilter)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
          >
            <option value="all">All statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <DataTable<Booking>
          columns={[
            {
              key: "code",
              header: "Booking",
              render: (booking) => (
                <div>
                  <p className="font-medium text-slate-900">{booking.code}</p>
                  <p className="text-xs text-slate-500">{formatDate(booking.checkInDate)}</p>
                </div>
              ),
            },
            {
              key: "guest",
              header: "Guest",
              render: (booking) => (
                <div>
                  <p className="font-medium text-slate-900">{booking.guest.name}</p>
                  {booking.guest.phone ? <p className="text-xs text-slate-500">{booking.guest.phone}</p> : null}
                  {booking.handledBy ? (
                    <p className="text-xs text-slate-500">Handled by: {booking.handledBy}</p>
                  ) : null}
                </div>
              ),
            },
            {
              key: "room",
              header: "Room",
              align: "center",
              render: (booking) => `Room ${roomById.get(booking.roomId)?.number ?? "N/A"}`,
            },
            {
              key: "stay",
              header: "Stay",
              render: (booking) => (
                <span className="text-xs text-slate-600">
                  {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (booking) => (
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${bookingStatusStyle(booking.status)}`}
                >
                  {bookingStatusLabel(booking.status)}
                </span>
              ),
            },
            {
              key: "amount",
              header: "Amount",
              align: "right",
              render: (booking) => formatMoney(booking.totalAmount),
            },
            {
              key: "actions",
              header: "Actions",
              align: "right",
              render: (booking) => (
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => checkoutBooking(booking.id)}
                    disabled={booking.status === "cancelled"}
                    className="h-8 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700 enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Check-out
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(booking)}
                    className="h-8 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => cancelBooking(booking.id)}
                    disabled={booking.status === "cancelled"}
                    className="h-8 rounded-md border border-rose-200 px-3 text-xs font-medium text-rose-700 enabled:hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  {roomById.get(booking.roomId)?.status === "cleaning" ? (
                    <button
                      type="button"
                      onClick={() => setRoomAvailable(booking.roomId)}
                      className="h-8 rounded-md border border-emerald-200 px-3 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      Set Available
                    </button>
                  ) : null}
                </div>
              ),
            },
          ]}
          data={visibleBookings}
          getRowKey={(booking) => booking.id}
          isLoading={isLoading}
          emptyTitle="No bookings found"
          emptyDescription="Try adjusting filters or create a new booking."
        />

        {actionMessage ? (
          <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{actionMessage}</p>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Reservation Calendar</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setViewMonth((current) => startOfMonthUTC(current.getUTCFullYear(), current.getUTCMonth() - 1))
              }
              className="h-9 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Prev
            </button>
            <p className="min-w-32 text-center text-sm font-semibold text-slate-800">{getMonthLabel(viewMonth)}</p>
            <button
              type="button"
              onClick={() =>
                setViewMonth((current) => startOfMonthUTC(current.getUTCFullYear(), current.getUTCMonth() + 1))
              }
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
                  day.isCurrentMonth
                    ? "border-slate-200 bg-white"
                    : "border-slate-100 bg-slate-50 text-slate-400"
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

      <FormSurface
        open={isFormOpen}
        onClose={closeForm}
        mode="drawer"
        title={formState.id ? "Edit Booking" : "Create Booking"}
        description="Update reservation details and status."
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeForm}
              className="h-10 rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveBooking}
              className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              {formState.id ? "Save Changes" : "Create Booking"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Guest Name</span>
            <input
              type="text"
              value={formState.guestName}
              onChange={(event) => setFormState((prev) => ({ ...prev, guestName: event.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Handled by (optional)</span>
            <input
              type="text"
              value={formState.handledBy}
              onChange={(event) => setFormState((prev) => ({ ...prev, handledBy: event.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              placeholder="e.g. Front Desk A"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Guest Phone</span>
              <input
                type="text"
                value={formState.guestPhone}
                onChange={(event) => setFormState((prev) => ({ ...prev, guestPhone: event.target.value }))}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">ID Number</span>
              <input
                type="text"
                value={formState.guestIdNumber}
                onChange={(event) => setFormState((prev) => ({ ...prev, guestIdNumber: event.target.value }))}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              />
            </label>
          </div>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Room</span>
            <select
              value={formState.roomId}
              onChange={(event) => setFormState((prev) => ({ ...prev, roomId: event.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800"
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.number} ({room.type})
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Check-in Date</span>
              <input
                type="date"
                value={formState.checkInDate}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    checkInDate: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Check-out Date</span>
              <input
                type="date"
                value={formState.checkOutDate}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    checkOutDate: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select
                value={formState.status}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    status: event.target.value as BookingStatus,
                  }))
                }
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800"
              >
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Paid Amount</span>
              <input
                type="number"
                min={0}
                value={formState.paidAmount}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    paidAmount: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Source</span>
              <select
                value={formState.source}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    source: event.target.value as Booking["source"],
                  }))
                }
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800"
              >
                <option value="walk-in">Walk-in</option>
                <option value="phone">Phone</option>
                <option value="website">Website</option>
                <option value="agent">Agent</option>
              </select>
            </label>
          </div>

          {formError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </p>
          ) : null}
        </div>
      </FormSurface>
    </div>
  );
}
