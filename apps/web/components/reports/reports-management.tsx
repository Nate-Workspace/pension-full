"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
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

import type { Booking, RoomType } from "@/data";
import { useOperationsData } from "@/components/providers/operations-provider";
import { ChartWrapper, MetricCard } from "@/components/ui";

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

const WEEK_DAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

function formatMoney(value: number): string {
  return `${value.toLocaleString("en-US")} Birr`;
}

function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function toIsoDate(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function eachDayInRange(startDate: string, endDate: string): string[] {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);

  const dates: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    dates.push(toIsoDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

function intersectsRange(
  booking: Pick<Booking, "checkInDate" | "checkOutDate">,
  startDate: string,
  endDate: string,
): boolean {
  return booking.checkInDate <= endDate && booking.checkOutDate > startDate;
}

function labelForRoomType(type: RoomType): string {
  if (type === "vip") {
    return "VIP";
  }

  return `${type.slice(0, 1).toUpperCase()}${type.slice(1)}`;
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

function shortDateLabel(isoDate: string): string {
  return parseIsoDate(isoDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function isDateInRange(
  day: string,
  startDate: string,
  endDate: string,
): boolean {
  return day >= startDate && day <= endDate;
}

export function ReportsManagement() {
  const { bookings, payments, rooms } = useOperationsData();
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState("2026-03-20");
  const [endDate, setEndDate] = useState("2026-04-02");

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  const roomById = useMemo(
    () => new Map(rooms.map((room) => [room.id, room])),
    [rooms],
  );
  const bookingById = useMemo(
    () => new Map(bookings.map((booking) => [booking.id, booking])),
    [bookings],
  );

  const validRange = startDate <= endDate;

  const scopedBookings = useMemo(() => {
    if (!validRange) {
      return [];
    }

    return bookings.filter(
      (booking) =>
        booking.status !== "cancelled" &&
        intersectsRange(booking, startDate, endDate),
    );
  }, [bookings, endDate, startDate, validRange]);

  const occupancySeries = useMemo<OccupancyPoint[]>(() => {
    if (!validRange) {
      return [];
    }

    const days = eachDayInRange(startDate, endDate);

    return days.map((day) => {
      const active = scopedBookings.filter(
        (booking) => day >= booking.checkInDate && day < booking.checkOutDate,
      ).length;

      return {
        day: shortDateLabel(day),
        rate: Math.round((active / rooms.length) * 100),
      };
    });
  }, [endDate, rooms.length, scopedBookings, startDate, validRange]);

  const revenueByRoomType = useMemo<RoomTypeRevenuePoint[]>(() => {
    const totals: Record<RoomType, number> = {
      single: 0,
      double: 0,
      vip: 0,
    };

    payments.forEach((payment) => {
      const paidDay = payment.paidAt?.slice(0, 10);

      if (!paidDay || !isDateInRange(paidDay, startDate, endDate)) {
        return;
      }

      const booking = bookingById.get(payment.bookingId);

      if (!booking || booking.status === "cancelled") {
        return;
      }

      const room = roomById.get(booking.roomId);

      if (!room) {
        return;
      }

      totals[room.type] += payment.amount;
    });

    return (["single", "double", "vip"] as const).map((roomType) => ({
      roomType: labelForRoomType(roomType),
      revenue: totals[roomType],
    }));
  }, [bookingById, endDate, payments, roomById, startDate]);

  const mostBookedRooms = useMemo<MostBookedRoomPoint[]>(() => {
    const counts = new Map<string, number>();

    scopedBookings.forEach((booking) => {
      counts.set(booking.roomId, (counts.get(booking.roomId) ?? 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([roomId, count]) => ({
        room: `Room ${roomById.get(roomId)?.number ?? "N/A"}`,
        count,
      }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5);
  }, [roomById, scopedBookings]);

  const peakBookingDays = useMemo<PeakDayPoint[]>(() => {
    const counts = new Map<number, number>();

    bookings
      .filter(
        (booking) =>
          booking.status !== "cancelled" &&
          isDateInRange(booking.checkInDate, startDate, endDate),
      )
      .forEach((booking) => {
        const dayIndex = parseIsoDate(booking.checkInDate).getUTCDay();
        counts.set(dayIndex, (counts.get(dayIndex) ?? 0) + 1);
      });

    return WEEK_DAY_LABELS.map((label, dayIndex) => ({
      day: label,
      count: counts.get(dayIndex) ?? 0,
    }));
  }, [bookings, endDate, startDate]);

  const summaries = useMemo(() => {
    const averageOccupancy =
      occupancySeries.length === 0
        ? 0
        : Math.round(
            occupancySeries.reduce((sum, item) => sum + item.rate, 0) /
              occupancySeries.length,
          );

    const totalRevenue = revenueByRoomType.reduce(
      (sum, item) => sum + item.revenue,
      0,
    );
    const peakDay = peakBookingDays.reduce<PeakDayPoint | null>((top, item) => {
      if (!top || item.count > top.count) {
        return item;
      }
      return top;
    }, null) ?? { day: "-", count: 0 };

    const topRoom = mostBookedRooms[0] ?? { room: "-", count: 0 };

    return {
      averageOccupancy,
      totalRevenue,
      peakDay,
      topRoom,
    };
  }, [mostBookedRooms, occupancySeries, peakBookingDays, revenueByRoomType]);

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
