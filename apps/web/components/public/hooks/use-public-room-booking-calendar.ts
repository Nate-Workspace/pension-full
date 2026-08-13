"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { PublicBookedRange, PublicRoomAvailabilityResponse } from "@repo/contracts";

import { fetchPublicRoomAvailability } from "@/lib/public-availability-service";
import {
  generateCalendarDays,
  getCalendarQueryRange,
  getTodayIsoDate,
  isDayBooked,
  isValidBookingRange,
  startOfMonthUTC,
} from "@/lib/public-calendar";

type UsePublicRoomBookingCalendarOptions = {
  roomId: string;
  initialAvailability: PublicRoomAvailabilityResponse | null;
  initialViewMonth?: Date;
};

export function usePublicRoomBookingCalendar({
  roomId,
  initialAvailability,
  initialViewMonth,
}: UsePublicRoomBookingCalendarOptions) {
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    if (initialViewMonth) {
      return initialViewMonth;
    }

    const now = new Date();
    return startOfMonthUTC(now.getUTCFullYear(), now.getUTCMonth());
  });
  const [bookedRanges, setBookedRanges] = useState<PublicBookedRange[]>(
    initialAvailability?.bookedRanges ?? [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCheckIn, setSelectedCheckIn] = useState<string | null>(null);
  const [selectedCheckOut, setSelectedCheckOut] = useState<string | null>(null);

  const calendarDays = useMemo(() => generateCalendarDays(viewMonth), [viewMonth]);
  const todayIso = useMemo(() => getTodayIsoDate(), []);
  const queryRange = useMemo(() => getCalendarQueryRange(viewMonth), [viewMonth]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const availability = await fetchPublicRoomAvailability(
          roomId,
          queryRange.from,
          queryRange.to,
        );

        if (!cancelled) {
          setBookedRanges(availability.bookedRanges);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load availability right now.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [roomId, queryRange.from, queryRange.to]);

  const clearSelection = useCallback(() => {
    setSelectedCheckIn(null);
    setSelectedCheckOut(null);
  }, []);

  const selectDay = useCallback(
    (iso: string) => {
      if (iso < todayIso || isDayBooked(iso, bookedRanges)) {
        return;
      }

      if (!selectedCheckIn || (selectedCheckIn && selectedCheckOut)) {
        setSelectedCheckIn(iso);
        setSelectedCheckOut(null);
        return;
      }

      if (iso <= selectedCheckIn) {
        setSelectedCheckIn(iso);
        setSelectedCheckOut(null);
        return;
      }

      if (!isValidBookingRange(selectedCheckIn, iso, bookedRanges, todayIso)) {
        setSelectedCheckIn(iso);
        setSelectedCheckOut(null);
        return;
      }

      setSelectedCheckOut(iso);
    },
    [bookedRanges, selectedCheckIn, selectedCheckOut, todayIso],
  );

  const hasCompleteSelection = Boolean(selectedCheckIn && selectedCheckOut);
  const isSelectionValid =
    hasCompleteSelection &&
    selectedCheckIn &&
    selectedCheckOut &&
    isValidBookingRange(selectedCheckIn, selectedCheckOut, bookedRanges, todayIso);

  return {
    viewMonth,
    setViewMonth,
    calendarDays,
    bookedRanges,
    isLoading,
    loadError,
    selectedCheckIn,
    selectedCheckOut,
    selectDay,
    clearSelection,
    hasCompleteSelection,
    isSelectionValid,
    todayIso,
  };
}

export type PublicRoomBookingCalendarState = ReturnType<
  typeof usePublicRoomBookingCalendar
>;
