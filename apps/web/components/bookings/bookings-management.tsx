"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import type { Booking, BookingStatus, Room } from "@/data";
import { useOperationsData } from "@/components/providers/operations-provider";
import { DataTable, FormSurface, MetricCard } from "@/components/ui";
import { apiFetch } from "@/lib/api-client";
import {
  diffNights,
  isBookingActiveOn,
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

type ApiErrorPayload = {
  message?: string | string[];
};

type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

function isPaginatedResponse<T>(value: unknown): value is PaginatedResponse<T> {
  return typeof value === "object" && value !== null && "data" in value && "meta" in value;
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  return searchParams.toString();
}

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

function createFormDefaults(roomList: Room[], operationDay?: string): BookingFormState {
  const checkInDate = operationDay ?? toIsoDate(new Date());

  return {
    guestName: "",
    guestPhone: "",
    guestIdNumber: "",
    handledBy: "",
    roomId: roomList[0]?.id ?? "",
    status: "confirmed",
    checkInDate,
    checkOutDate: addIsoDays(checkInDate, 2),
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

function addIsoDays(isoDate: string, days: number): string {
  const value = parseIsoDate(isoDate);
  value.setUTCDate(value.getUTCDate() + days);
  return toIsoDate(value);
}

function mapApiRoomToUiRoom(room: Room): Room {
  return {
    ...room,
    price: room.pricePerNight,
  };
}

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

  if (!payload?.message) {
    return fallback;
  }

  if (Array.isArray(payload.message)) {
    return payload.message[0] ?? fallback;
  }

  return payload.message;
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { operationDay } = useOperationsData();
  const search = searchParams.get("search")?.trim() ?? "";
  const statusFilter = (searchParams.get("status") as BookingFilter | null) ?? "all";
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const pageSize = parsePositiveInteger(searchParams.get("pageSize"), 10);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState<BookingFormState>(() => createFormDefaults([], operationDay));
  const [formError, setFormError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const day = parseIsoDate(operationDay);
    return startOfMonthUTC(day.getUTCFullYear(), day.getUTCMonth());
  });

  const roomsQuery = useQuery({
    queryKey: ["rooms", { scope: "all", operationDay }],
    queryFn: async () => {
      const params = buildQueryString({ operationDay });

      const response = await apiFetch(`/rooms${params.length > 0 ? `?${params}` : ""}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, `Failed to load rooms (${response.status}).`));
      }

      const payload = (await response.json()) as PaginatedResponse<Room> | Room[];
      const rows = Array.isArray(payload)
        ? payload
        : isPaginatedResponse<Room>(payload)
          ? payload.data
          : [];

      return rows.map(mapApiRoomToUiRoom);
    },
  });

  const fullBookingsQuery = useQuery({
    queryKey: ["bookings", { scope: "all", operationDay, search, status: statusFilter }],
    queryFn: async () => {
      const params = buildQueryString({
        operationDay,
        search: search.length > 0 ? search : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      const response = await apiFetch(`/bookings${params.length > 0 ? `?${params}` : ""}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, `Failed to load bookings (${response.status}).`));
      }

      const payload = (await response.json()) as PaginatedResponse<Booking> | Booking[];

      return Array.isArray(payload)
        ? payload
        : isPaginatedResponse<Booking>(payload)
          ? payload.data
          : [];
    },
  });

  const pagedBookingsQuery = useQuery({
    queryKey: ["bookings", { scope: "page", operationDay, search, status: statusFilter, page, pageSize }],
    queryFn: async () => {
      const params = buildQueryString({
        page,
        pageSize,
        operationDay,
        search: search.length > 0 ? search : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      const response = await apiFetch(`/bookings?${params}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, `Failed to load bookings (${response.status}).`));
      }

      const payload = (await response.json()) as PaginatedResponse<Booking> | Booking[];

      if (Array.isArray(payload)) {
        const total = payload.length;
        const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
        const startIndex = (page - 1) * pageSize;

        return {
          data: payload.slice(startIndex, startIndex + pageSize),
          meta: {
            page,
            pageSize,
            total,
            totalPages,
          },
        };
      }

      return isPaginatedResponse<Booking>(payload)
        ? payload
        : {
            data: [],
            meta: {
              page,
              pageSize,
              total: 0,
              totalPages: 0,
            },
          };
    },
  });

  const rooms = useMemo(() => roomsQuery.data ?? [], [roomsQuery.data]);
  const bookings = useMemo(() => fullBookingsQuery.data ?? [], [fullBookingsQuery.data]);
  const pageBookings = useMemo(() => pagedBookingsQuery.data?.data ?? [], [pagedBookingsQuery.data]);
  const pageMeta = pagedBookingsQuery.data?.meta;
  const isLoading = roomsQuery.isLoading || fullBookingsQuery.isLoading || pagedBookingsQuery.isLoading;

  useEffect(() => {
    if (searchParams.get("page") && searchParams.get("pageSize")) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", searchParams.get("page") ?? "1");
    params.set("pageSize", searchParams.get("pageSize") ?? "10");

    const nextQuery = params.toString();
    router.replace(nextQuery.length > 0 ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  const updateUrlState = (nextParams: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(nextParams).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        params.delete(key);
        return;
      }

      params.set(key, String(value));
    });

    const nextQuery = params.toString();
    router.replace(nextQuery.length > 0 ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  const refreshData = async () => {
    await Promise.all([roomsQuery.refetch(), fullBookingsQuery.refetch(), pagedBookingsQuery.refetch()]);
  };

  useEffect(() => {
    const error = fullBookingsQuery.error ?? roomsQuery.error ?? pagedBookingsQuery.error;

    if (error) {
      console.error(error);
      setActionMessage(error instanceof Error ? error.message : "Unable to load bookings.");
    }
  }, [fullBookingsQuery.error, pagedBookingsQuery.error, roomsQuery.error]);

  const roomById = useMemo(() => byId<Room>(rooms), [rooms]);

  const metrics = useMemo(() => {
    const confirmed = bookings.filter((booking) => booking.status === "confirmed").length;
    const pending = bookings.filter((booking) => booking.status === "pending").length;
    const cancelled = bookings.filter((booking) => booking.status === "cancelled").length;
    const monthPrefix = operationDay.slice(0, 7);
    const monthRevenue = bookings
      .filter((booking) => booking.status === "confirmed" && booking.checkInDate.startsWith(monthPrefix))
      .reduce((sum, booking) => sum + booking.totalAmount, 0);

    return {
      total: bookings.length,
      confirmed,
      pending,
      cancelled,
      monthRevenue,
    };
  }, [bookings, operationDay]);

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
    setFormState(createFormDefaults(rooms, operationDay));
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

    void (async () => {
      try {
        const response = await apiFetch(`/bookings/${bookingId}/checkout`, {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(await getErrorMessage(response, `Failed to check out booking (${response.status}).`));
        }

        await refreshData();
        setActionMessage(`Booking ${booking.code} checked out. Room moved to cleaning.`);
      } catch (error) {
        console.error(error);
        setActionMessage(error instanceof Error ? error.message : "Unable to check out booking.");
      }
    })();
  };

  const setRoomAvailable = (roomId: string) => {
    if (bookings.some((booking) => booking.roomId === roomId && isBookingActiveOn(operationDay, booking))) {
      setActionMessage("Room cannot be set to available while an active booking exists.");
      return;
    }

    void (async () => {
      try {
        const response = await apiFetch(`/rooms/${roomId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ status: "available" }),
        });

        if (!response.ok) {
          throw new Error(await getErrorMessage(response, `Failed to set room available (${response.status}).`));
        }

        await refreshData();
        setActionMessage("Room marked as available.");
      } catch (error) {
        console.error(error);
        setActionMessage(error instanceof Error ? error.message : "Unable to set room as available.");
      }
    })();
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

    const payload = {
      guestName: formState.guestName.trim(),
      guestPhone: formState.guestPhone.trim() || undefined,
      guestIdNumber: formState.guestIdNumber.trim() || undefined,
      handledBy: formState.handledBy.trim() || undefined,
      roomId: formState.roomId,
      status: formState.status,
      checkInDate: formState.checkInDate,
      checkOutDate: formState.checkOutDate,
      paidAmount: parsedPaidAmount,
      source: formState.source,
    };

    void (async () => {
      try {
        const endpoint = formState.id ? `/bookings/${formState.id}` : "/bookings";
        const method = formState.id ? "PATCH" : "POST";

        const response = await apiFetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await getErrorMessage(response, `Failed to save booking (${response.status}).`));
        }

        await refreshData();
        setIsFormOpen(false);
        setFormError(null);
        setActionMessage("Booking saved successfully.");
      } catch (error) {
        console.error(error);
        setFormError(error instanceof Error ? error.message : "Unable to save booking.");
      }
    })();
  };

  const cancelBooking = (bookingId: string) => {
    const booking = bookings.find((item) => item.id === bookingId);

    void (async () => {
      try {
        const response = await apiFetch(`/bookings/${bookingId}/cancel`, {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(await getErrorMessage(response, `Failed to cancel booking (${response.status}).`));
        }

        await refreshData();
        setActionMessage(booking ? `Booking ${booking.code} cancelled.` : "Booking cancelled.");
      } catch (error) {
        console.error(error);
        setActionMessage(error instanceof Error ? error.message : "Unable to cancel booking.");
      }
    })();
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
            onChange={(event) => updateUrlState({ search: event.target.value, page: 1 })}
            placeholder="Search by code, guest, room"
            className="h-10 w-full max-w-sm rounded-md border border-slate-200 px-3 text-sm text-slate-700"
          />

          <select
            value={statusFilter}
            onChange={(event) => updateUrlState({ status: event.target.value, page: 1 })}
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
          data={pageBookings}
          getRowKey={(booking) => booking.id}
          isLoading={isLoading}
          emptyTitle="No bookings found"
          emptyDescription="Try adjusting filters or create a new booking."
          page={page}
          pageSize={pageSize}
          totalPages={pageMeta?.totalPages ?? 0}
          onPageChange={(nextPage) => updateUrlState({ page: nextPage })}
          onPageSizeChange={(nextPageSize) => updateUrlState({ pageSize: nextPageSize, page: 1 })}
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
