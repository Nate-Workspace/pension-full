import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Booking, BookingStatus, Room } from "@/data";
import { diffNights, parseIsoDate, toIsoDate } from "@/lib/operations";
import {
  cancelBooking,
  checkoutBooking,
  fetchAvailableRooms,
  saveBooking,
} from "../services/bookings-service";
import { useBookings } from "./use-bookings";

export type BookingFormState = {
  id?: string;
  guestName: string;
  guestPhone: string;
  guestIdNumber: string;
  handledBy: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  paidAmount: string;
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
  checkInDate: string;
  checkOutDate: string;
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
  if (status === "active") {
    return "Active";
  }

  if (status === "upcoming") {
    return "Upcoming";
  }

  if (status === "checked_out") {
    return "Checked Out";
  }

  return "Canceled";
}

export function bookingStatusStyle(status: BookingStatus): string {
  if (status === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "upcoming") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "checked_out") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
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
    checkInDate,
    checkOutDate: addIsoDays(checkInDate, 2),
    paidAmount: "0",
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
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    paidAmount: String(booking.paidAmount),
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
      setActionMessage(booking ? `Booking ${booking.code} canceled. Room moved to available.` : "Booking canceled.");
    },
    onError: (error) => {
      console.error(error);
      setActionMessage(error instanceof Error ? error.message : "Unable to cancel booking.");
    },
  });

  useEffect(() => {
    if (loadError) {
      console.error(loadError);
      setActionMessage(loadError instanceof Error ? loadError.message : "Unable to load bookings.");
    }
  }, [loadError]);

  const roomById = useMemo(() => byId<Room>(rooms), [rooms]);

  const hasValidDateRange =
    formState.checkInDate.length === 10 &&
    formState.checkOutDate.length === 10 &&
    diffNights(formState.checkInDate, formState.checkOutDate) > 0;

  const availableRoomsQuery = useQuery({
    queryKey: ["available-rooms", formState.checkInDate, formState.checkOutDate, formState.id ?? "new"],
    queryFn: () =>
      fetchAvailableRooms({
        checkInDate: formState.checkInDate,
        checkOutDate: formState.checkOutDate,
        excludeBookingId: formState.id,
      }),
    enabled: isFormOpen && hasValidDateRange,
    staleTime: 30_000,
  });

  const availableRooms = useMemo(() => availableRoomsQuery.data ?? [], [availableRoomsQuery.data]);

  useEffect(() => {
    if (!isFormOpen) {
      return;
    }

    if (!hasValidDateRange) {
      if (formState.roomId.length === 0) {
        return;
      }

      setFormState((prev) => ({ ...prev, roomId: "" }));
      return;
    }

    if (availableRooms.length === 0) {
      if (formState.roomId.length === 0) {
        return;
      }

      setFormState((prev) => ({ ...prev, roomId: "" }));
      return;
    }

    if (availableRooms.some((room) => room.id === formState.roomId)) {
      return;
    }

    setFormState((prev) => ({
      ...prev,
      roomId: availableRooms[0]?.id ?? "",
    }));
  }, [availableRooms, formState.roomId, hasValidDateRange, isFormOpen, setFormState]);

  const selectedRoom = useMemo(() => {
    if (!formState.roomId) {
      return null;
    }

    return availableRooms.find((room) => room.id === formState.roomId) ?? roomById.get(formState.roomId) ?? null;
  }, [availableRooms, formState.roomId, roomById]);

  const computedNights = hasValidDateRange ? diffNights(formState.checkInDate, formState.checkOutDate) : 0;
  const computedTotalAmount = selectedRoom && computedNights > 0 ? selectedRoom.pricePerNight * computedNights : 0;

  const metrics = useMemo(() => {
    const active = bookings.filter((booking) => booking.status === "active").length;
    const upcoming = bookings.filter((booking) => booking.status === "upcoming").length;
    const checkedOut = bookings.filter((booking) => booking.status === "checked_out").length;
    const canceled = bookings.filter((booking) => booking.status === "canceled" || booking.status === "cancelled").length;
    const monthPrefix = operationDay.slice(0, 7);
    const monthRevenue = bookings
      .filter(
        (booking) =>
          booking.status !== "canceled" &&
          booking.status !== "cancelled" &&
          booking.checkInDate.startsWith(monthPrefix),
      )
      .reduce((sum, booking) => sum + booking.totalAmount, 0);

    return {
      total: bookings.length,
      active,
      upcoming,
      checkedOut,
      canceled,
      monthRevenue,
    };
  }, [bookings, operationDay]);

  const calendarDays = useMemo(() => generateCalendarDays(viewMonth), [viewMonth]);

  const reservationsByDay = useMemo(() => {
    const map = new Map<string, CalendarReservation[]>();

    bookings.forEach((booking) => {
      calendarDays.forEach((day) => {
        if (!occursOnDay(booking, day.iso)) {
          return;
        }

        const room = roomById.get(booking.roomId);

        const entry: CalendarReservation = {
          id: booking.id,
          guestName: booking.guest.name,
          roomNumber: room?.number ?? "N/A",
          status: booking.status === "cancelled" ? "canceled" : booking.status,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
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

    if (booking.status === "canceled" || booking.status === "cancelled") {
      setActionMessage("Canceled bookings cannot be checked out.");
      return;
    }

    if (booking.status === "checked_out") {
      setActionMessage("This booking is already checked out.");
      return;
    }

    if (booking.status === "upcoming") {
      setActionMessage("Only active bookings can be checked out.");
      return;
    }

    checkoutBookingMutation.mutate(bookingId);
  };

  const handleSaveBooking = () => {
    const nights = diffNights(formState.checkInDate, formState.checkOutDate);

    if (nights <= 0) {
      setFormError("Check-out date must be after check-in date.");
      return;
    }

    const room = availableRooms.find((item) => item.id === formState.roomId);

    if (!room) {
      setFormError("Please select an available room for the selected dates.");
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
      checkInDate: formState.checkInDate,
      checkOutDate: formState.checkOutDate,
      paidAmount: parsedPaidAmount,
    });
  };

  const handleCancelBooking = (bookingId: string) => {
    cancelBookingMutation.mutate(bookingId);
  };

  const pendingCheckoutBookingId = checkoutBookingMutation.variables;
  const pendingCancelBookingId = cancelBookingMutation.variables;
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
    availableRooms,
    hasValidDateRange,
    isLoadingAvailableRooms: availableRoomsQuery.isFetching,
    computedNights,
    computedTotalAmount,
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
    viewMonth,
    setViewMonth,
    calendarDays,
    reservationsByDay,
    updateUrlState,
    openCreate,
    openEdit,
    closeForm,
    handleCheckoutBooking,
    handleSaveBooking,
    handleCancelBooking,
    getMonthLabel,
    startOfMonthUTC,
  };
}
