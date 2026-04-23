import { apiFetch } from "@/lib/api-client";

export type OccupancyPoint = {
  day: string;
  rate: number;
};

export type RoomTypeRevenuePoint = {
  roomType: string;
  revenue: number;
};

export type MostBookedRoomPoint = {
  room: string;
  count: number;
};

export type PeakDayPoint = {
  day: string;
  count: number;
};

export type ReportsAnalyticsResponse = {
  startDate: string;
  endDate: string;
  occupancySeries: OccupancyPoint[];
  revenueSeries: Array<{ day: string; revenue: number }>;
  revenueByRoomType: RoomTypeRevenuePoint[];
  mostBookedRooms: MostBookedRoomPoint[];
  peakBookingDays: PeakDayPoint[];
  summaries: {
    averageOccupancy: number;
    totalRevenue: number;
    topRoom: MostBookedRoomPoint;
    peakDay: PeakDayPoint;
  };
};

type ApiErrorPayload = {
  message?: string | string[];
};

export async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  if (response.status === 403) {
    return "You do not have permission";
  }

  const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

  if (!payload?.message) {
    return fallback;
  }

  if (Array.isArray(payload.message)) {
    return payload.message[0] ?? fallback;
  }

  return payload.message;
}

export function formatMoney(value: number): string {
  return `${value.toLocaleString("en-US")} Birr`;
}

export function toNumber(value: number | string | readonly (number | string)[] | undefined): number {
  if (Array.isArray(value)) {
    return toNumber(value[0]);
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

export async function fetchReportsAnalytics(startDate: string, endDate: string): Promise<ReportsAnalyticsResponse> {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });

  const response = await apiFetch(`/reports/analytics?${params.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Failed to load reports analytics (${response.status}).`));
  }

  return (await response.json()) as ReportsAnalyticsResponse;
}
