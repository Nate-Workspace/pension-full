import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { Booking, BookingStatus, Room } from "@/data";
import { diffNights, isBookingActiveOn, parseIsoDate, toIsoDate } from "@/lib/operations";
import {
  cancelBooking,
  checkoutBooking,
  saveBooking,
  setRoomAvailable,
} from "../services/bookings-service";
import { useBookings } from "./use-bookings";

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
  const queryClient = useQueryClient();
  const {
    operationDay,
    search,
    statusFilter,
    page,
    pageSize,
    rooms,
    bookings,
    pageBookings,
    pageMeta,
    isLoading,
    loadError,
    updateUrlState,
    refreshData,
  } = useBookings();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formState, setFormState] = useState<BookingFormState>(() => createFormDefaults([], operationDay));
  const [initialFormState, setInitialFormState] = useState<BookingFormState>(() => createFormDefaults([], operationDay));
  const [formError, setFormError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const day = parseIsoDate(operationDay);
    return startOfMonthUTC(day.getUTCFullYear(), day.getUTCMonth());
  });

  const invalidateRoomRelatedQueries = async (roomIds: string[]) => {
    const uniqueRoomIds = [...new Set(roomIds.filter((roomId) => roomId.trim().length > 0))];

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["rooms"] }),
      ...uniqueRoomIds.flatMap((id) => [
        queryClient.invalidateQueries({ queryKey: ["room", id] }),
        queryClient.invalidateQueries({ queryKey: ["room-bookings", id] }),
      ]),
    ]);
  };

  const saveBookingMutation = useMutation({
    mutationFn: saveBooking,
    onSuccess: async (_, variables) => {
      const previousRoomId = variables.id ? bookings.find((item) => item.id === variables.id)?.roomId : undefined;

      await refreshData();
      await invalidateRoomRelatedQueries([variables.roomId, previousRoomId ?? ""]);
      setIsFormOpen(false);
      setFormError(null);
      setActionMessage("Booking saved successfully.");
    },
    onError: (error) => {
      console.error(error);
      setFormError(error instanceof Error ? error.message : "Unable to save booking.");
    },
  });

  const checkoutBookingMutation = useMutation({
    mutationFn: checkoutBooking,
    onSuccess: async (_, bookingId) => {
      const booking = bookings.find((item) => item.id === bookingId);
      await refreshData();
      await invalidateRoomRelatedQueries(booking?.roomId ? [booking.roomId] : []);
      setActionMessage(booking ? `Booking ${booking.code} checked out. Room moved to cleaning.` : "Booking checked out.");
    },
    onError: (error) => {
      console.error(error);
      setActionMessage(error instanceof Error ? error.message : "Unable to check out booking.");
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: async (_, bookingId) => {
      const booking = bookings.find((item) => item.id === bookingId);
      await refreshData();
      await invalidateRoomRelatedQueries(booking?.roomId ? [booking.roomId] : []);
      setActionMessage(booking ? `Booking ${booking.code} cancelled.` : "Booking cancelled.");
    },
    onError: (error) => {
      console.error(error);
      setActionMessage(error instanceof Error ? error.message : "Unable to cancel booking.");
    },
  });

  const setRoomAvailableMutation = useMutation({
    mutationFn: setRoomAvailable,
    onSuccess: async (_, roomId) => {
      await refreshData();
      await invalidateRoomRelatedQueries([roomId]);
      setActionMessage("Room marked as available.");
    },
    onError: (error) => {
      console.error(error);
      setActionMessage(error instanceof Error ? error.message : "Unable to set room as available.");
    },
  });

  useEffect(() => {
    if (loadError) {
      console.error(loadError);
      setActionMessage(loadError instanceof Error ? loadError.message : "Unable to load bookings.");
    }
  }, [loadError]);

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
    const nextState = createFormDefaults(rooms, operationDay);
    setFormError(null);
    setActionMessage(null);
    setFormState(nextState);
    setInitialFormState(nextState);
    setIsFormOpen(true);
  };

  const openEdit = (booking: Booking) => {
    const nextState = createFormFromBooking(booking);
    setFormError(null);
    setActionMessage(null);
    setFormState(nextState);
    setInitialFormState(nextState);
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

    checkoutBookingMutation.mutate(bookingId);
  };

  const handleSetRoomAvailable = (roomId: string) => {
    if (bookings.some((booking) => booking.roomId === roomId && isBookingActiveOn(operationDay, booking))) {
      setActionMessage("Room cannot be set to available while an active booking exists.");
      return;
    }

    setRoomAvailableMutation.mutate(roomId);
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

    saveBookingMutation.mutate({
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
  };

  const handleCancelBooking = (bookingId: string) => {
    cancelBookingMutation.mutate(bookingId);
  };

  const pendingCheckoutBookingId = checkoutBookingMutation.variables;
  const pendingCancelBookingId = cancelBookingMutation.variables;
  const pendingAvailableRoomId = setRoomAvailableMutation.variables;
  const isFormDirty = useMemo(
    () => JSON.stringify(formState) !== JSON.stringify(initialFormState),
    [formState, initialFormState],
  );

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
    isFormDirty,
    isSavingBooking: saveBookingMutation.isPending,
    pendingCheckoutBookingId,
    pendingCancelBookingId,
    pendingAvailableRoomId,
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
