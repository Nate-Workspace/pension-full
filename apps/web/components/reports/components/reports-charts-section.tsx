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

import { ChartWrapper } from "@/components/ui";

import { formatMoney, toNumber } from "../services/reports-service";

type Props = {
  isLoading: boolean;
  occupancySeries: Array<{ day: string; rate: number }>;
  revenueByRoomType: Array<{ roomType: string; revenue: number }>;
  mostBookedRooms: Array<{ room: string; count: number }>;
  peakBookingDays: Array<{ day: string; count: number }>;
};

export function ReportsChartsSection({
  isLoading,
  occupancySeries,
  revenueByRoomType,
  mostBookedRooms,
  peakBookingDays,
}: Props) {
  return (
    <>
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
              <XAxis dataKey="day" stroke="#94a3b8" tickLine={false} axisLine={false} />
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
              <XAxis dataKey="roomType" stroke="#94a3b8" tickLine={false} axisLine={false} />
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
              <XAxis dataKey="room" stroke="#94a3b8" tickLine={false} axisLine={false} />
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
              <XAxis dataKey="day" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => toNumber(value)} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#ea580c" />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </section>
    </>
  );
}
