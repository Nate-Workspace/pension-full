"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartWrapper, MetricCard } from "@/components/ui";
import { apiFetch } from "@/lib/api-client";

type OccupancyPoint = {
  day: string;
  rate: number;
};

type RoomTypeRevenuePoint = {
  roomType: string;
  revenue: number;
};

type MostBookedRoomPoint = {
  room: string;
  count: number;
};

type PeakDayPoint = {
  day: string;
  count: number;
};

type ReportsAnalyticsResponse = {
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

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
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

function formatMoney(value: number): string {
  return `${value.toLocaleString("en-US")} Birr`;
}

function toNumber(
  value: number | string | readonly (number | string)[] | undefined,
): number {
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

export function ReportsManagement() {
  const [startDate, setStartDate] = useState("2026-03-20");
  const [endDate, setEndDate] = useState("2026-04-02");
  const [formError, setFormError] = useState<string | null>(null);

  const validRange = startDate <= endDate;

  const { data, isLoading, error } = useQuery({
    queryKey: ["reports", { startDate, endDate }],
    enabled: validRange,
    queryFn: async () => {
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
    },
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

  const occupancySeries = data?.occupancySeries ?? [];
  const revenueByRoomType = data?.revenueByRoomType ?? [];
  const mostBookedRooms = data?.mostBookedRooms ?? [];
  const peakBookingDays = data?.peakBookingDays ?? [];
  const summaries = data?.summaries ?? {
    averageOccupancy: 0,
    totalRevenue: 0,
    peakDay: { day: "-", count: 0 },
    topRoom: { room: "-", count: 0 },
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Analyze occupancy, booking behavior, and revenue performance across
            selected dates.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3">
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Start Date
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-10 rounded-md border border-slate-200 px-3 text-sm text-slate-700"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              End Date
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="h-10 rounded-md border border-slate-200 px-3 text-sm text-slate-700"
            />
          </label>
        </div>
      </section>

      {!validRange ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          End date must be greater than or equal to start date.
        </section>
      ) : null}

      {formError && validRange ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError}
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Average Occupancy"
          value={`${summaries.averageOccupancy}%`}
        />
        <MetricCard
          title="Revenue in Range"
          value={formatMoney(summaries.totalRevenue)}
        />
        <MetricCard
          title="Most Booked Room"
          value={summaries.topRoom.room}
          description={`${summaries.topRoom.count} bookings`}
        />
        <MetricCard
          title="Peak Booking Day"
          value={summaries.peakDay.day}
          description={`${summaries.peakDay.count} check-ins`}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartWrapper
          title="Occupancy Analytics"
          description="Daily occupancy rate across selected date range"
          isLoading={isLoading}
          minHeightClassName="min-h-[300px]"
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={occupancySeries}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
              <XAxis
                dataKey="day"
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip formatter={(value) => `${toNumber(value)}%`} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#0f766e"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#0f766e" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper
          title="Revenue by Room Type"
          description="Revenue contribution by single, double, and VIP rooms"
          isLoading={isLoading}
          minHeightClassName="min-h-[300px]"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueByRoomType}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
              <XAxis
                dataKey="roomType"
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              />
              <Tooltip formatter={(value) => formatMoney(toNumber(value))} />
              <Bar dataKey="revenue" radius={[8, 8, 0, 0]} fill="#1d4ed8" />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartWrapper
          title="Most Booked Rooms"
          description="Top rooms by reservation frequency"
          isLoading={isLoading}
          minHeightClassName="min-h-[300px]"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mostBookedRooms}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
              <XAxis
                dataKey="room"
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => toNumber(value)} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#7c3aed" />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper
          title="Peak Booking Days"
          description="Check-in volume by day of week"
          isLoading={isLoading}
          minHeightClassName="min-h-[300px]"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={peakBookingDays}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
              <XAxis
                dataKey="day"
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
              />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => toNumber(value)} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#ea580c" />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </section>
    </div>
  );
}
