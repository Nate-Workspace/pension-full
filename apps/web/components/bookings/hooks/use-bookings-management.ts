import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import type { Booking, BookingStatus, Room } from "@/data";
import { useOperationsData } from "@/components/providers/operations-provider";
import { diffNights, isBookingActiveOn, parseIsoDate, toIsoDate } from "@/lib/operations";
import {
  cancelBooking,
  checkoutBooking,
  fetchAllBookings,
  fetchPagedBookings,
  fetchRooms,
  parsePositiveInteger,
  saveBooking,
  setRoomAvailable,
  type BookingFilter,
} from "../services/bookings-service";

export type BookingFormState = {
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

export type CalendarDay = {
  key: string;
  date: Date;
  iso: string;
  isCurrentMonth: boolean;
};

export type CalendarReservation = {
  id: string;
  guestName: string;
  roomNumber: string;
  status: BookingStatus;
};

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function formatDate(value: string): string {
  return parseIsoDate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMoney(value: number): string {
  return `${value.toLocaleString("en-US")} Birr`;
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

export function bookingStatusStyle(status: BookingStatus): string {
  if (status === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

function addIsoDays(isoDate: string, days: number): string {
  const value = parseIsoDate(isoDate);
  value.setUTCDate(value.getUTCDate() + days);
  return toIsoDate(value);
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

export function useBookingsManagement() {
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
    queryFn: async () => fetchRooms(operationDay),
  });

  const fullBookingsQuery = useQuery({
    queryKey: ["bookings", { scope: "all", operationDay, search, status: statusFilter }],
    queryFn: async () => fetchAllBookings({ operationDay, search, statusFilter }),
  });

  const pagedBookingsQuery = useQuery({
    queryKey: ["bookings", { scope: "page", operationDay, search, status: statusFilter, page, pageSize }],
    queryFn: async () => fetchPagedBookings({ page, pageSize, operationDay, search, statusFilter }),
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

  const handleCheckoutBooking = (bookingId: string) => {
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
        await checkoutBooking(bookingId);
        await refreshData();
        setActionMessage(`Booking ${booking.code} checked out. Room moved to cleaning.`);
      } catch (error) {
        console.error(error);
        setActionMessage(error instanceof Error ? error.message : "Unable to check out booking.");
      }
    })();
  };

  const handleSetRoomAvailable = (roomId: string) => {
    if (bookings.some((booking) => booking.roomId === roomId && isBookingActiveOn(operationDay, booking))) {
      setActionMessage("Room cannot be set to available while an active booking exists.");
      return;
    }

    void (async () => {
      try {
        await setRoomAvailable(roomId);
        await refreshData();
        setActionMessage("Room marked as available.");
      } catch (error) {
        console.error(error);
        setActionMessage(error instanceof Error ? error.message : "Unable to set room as available.");
      }
    })();
  };

  const handleSaveBooking = () => {
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

    void (async () => {
      try {
        await saveBooking({
          id: formState.id,
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
        });

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

  const handleCancelBooking = (bookingId: string) => {
    const booking = bookings.find((item) => item.id === bookingId);

    void (async () => {
      try {
        await cancelBooking(bookingId);
        await refreshData();
        setActionMessage(booking ? `Booking ${booking.code} cancelled.` : "Booking cancelled.");
      } catch (error) {
        console.error(error);
        setActionMessage(error instanceof Error ? error.message : "Unable to cancel booking.");
      }
    })();
  };

  return {
    search,
    statusFilter,
    page,
    pageSize,
    rooms,
    bookings,
    pageBookings,
    roomById,
    pageMeta,
    isLoading,
    metrics,
    actionMessage,
    isFormOpen,
    formState,
    setFormState,
    formError,
    viewMonth,
    setViewMonth,
    calendarDays,
    reservationsByDay,
    updateUrlState,
    openCreate,
    openEdit,
    closeForm,
    handleCheckoutBooking,
    handleSetRoomAvailable,
    handleSaveBooking,
    handleCancelBooking,
    getMonthLabel,
    startOfMonthUTC,
  };
}
