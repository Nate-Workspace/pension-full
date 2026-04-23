import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchReportsAnalytics } from "../services/reports-service";

export function useReportsAnalytics() {
  const [startDate, setStartDate] = useState("2026-03-20");
  const [endDate, setEndDate] = useState("2026-04-02");
  const [formError, setFormError] = useState<string | null>(null);

  const validRange = startDate <= endDate;

  const { data, isLoading, error } = useQuery({
    queryKey: ["reports", { startDate, endDate }],
    enabled: validRange,
    queryFn: async () => fetchReportsAnalytics(startDate, endDate),
  });

  useEffect(() => {
    if (!validRange) {
      return;
    }

    if (error) {
      console.error(error);
      setFormError(error instanceof Error ? error.message : "Unable to load reports.");
      return;
    }

    setFormError(null);
  }, [error, validRange]);

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    formError,
    validRange,
    isLoading,
    occupancySeries: data?.occupancySeries ?? [],
    revenueByRoomType: data?.revenueByRoomType ?? [],
    mostBookedRooms: data?.mostBookedRooms ?? [],
    peakBookingDays: data?.peakBookingDays ?? [],
    summaries: data?.summaries ?? {
      averageOccupancy: 0,
      totalRevenue: 0,
      peakDay: { day: "-", count: 0 },
      topRoom: { room: "-", count: 0 },
    },
  };
}
