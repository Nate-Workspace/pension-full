"use client";

import { useCallback, useMemo, useState } from "react";
import { useEffect } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Booking, BookingStatus, Room } from "@/data";
import { ChartWrapper, DataTable, MetricCard, StatusBadge } from "@/components/ui";
import { apiFetch } from "@/lib/api-client";
import { toIsoDate } from "@/lib/operations";

type OccupancyPoint = {
  label: string;
  occupancyRate: number;
};

type RevenuePoint = {
  label: string;
  revenue: number;
};

type DashboardSummary = {
  operationDay: string;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  cleaningRooms: number;
  todayRevenue: number;
  monthlyRevenue: number;
  outstandingPayments: number;
  occupancyRate: number;
};

type DashboardTrends = {
  operationDay: string;
  occupancySeries: OccupancyPoint[];
  revenueSeries: RevenuePoint[];
};

type RecentBookingRow = {
  id: string;
  bookingCode: string;
  guestName: string;
  guestPhone?: string;
  roomNumber: string;
  status: BookingStatus;
  totalAmount: number;
  checkInDate: string;
};

type CheckInItem = {
  id: string;
  guestName: string;
  guestPhone?: string;
  roomNumber: string;
  roomStatus: Room["status"];
  checkInDate: string;
  checkOutDate: string;
};

type AlertRow = {
  id: string;
  category: "checkout" | "payment" | "cleaning";
  subject: string;
  detail: string;
  status: string;
};

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("en-US")} Birr`;
}

function toNumber(value: number | string | readonly (number | string)[] | undefined): number {
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

function dateLabel(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function monthLabel(value: string): string {
  return new Date(`${value}-01T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function statusStyles(status: BookingStatus): string {
  if (status === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

function statusLabel(status: BookingStatus): string {
  if (status === "confirmed") {
    return "Confirmed";
  }

  if (status === "pending") {
    return "Pending";
  }

  return "Cancelled";
}

function alertCategoryStyles(category: AlertRow["category"]): string {
  if (category === "checkout") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (category === "payment") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-sky-200 bg-sky-50 text-sky-700";
}

function alertCategoryLabel(category: AlertRow["category"]): string {
  if (category === "checkout") {
    return "Check-out Today";
  }

  if (category === "payment") {
    return "Payment Follow-up";
  }

  return "Cleaning";
}

async function getJson<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    throw new Error(fallback);
  }

  return (await response.json()) as T;
}

export function DashboardOverview() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<DashboardTrends | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [operationDay] = useState<string>(() => toIsoDate(new Date()));

  const fetchDashboard = useCallback(async () => {
    const params = new URLSearchParams({ operationDay });

    const [summaryResponse, trendsResponse, bookingsResponse, roomsResponse] = await Promise.all([
      apiFetch(`/dashboard/summary?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      }),
      apiFetch(`/dashboard/trends?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      }),
      apiFetch("/bookings", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      }),
      apiFetch(`/rooms?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      }),
    ]);

    const [summaryPayload, trendsPayload, bookingsPayload, roomsPayload] = await Promise.all([
      getJson<DashboardSummary>(summaryResponse, "Failed to load dashboard summary."),
      getJson<DashboardTrends>(trendsResponse, "Failed to load dashboard trends."),
      getJson<Booking[]>(bookingsResponse, "Failed to load bookings."),
      getJson<Room[]>(roomsResponse, "Failed to load rooms."),
    ]);

    setSummary(summaryPayload);
    setTrends(trendsPayload);
    setBookings(bookingsPayload);
    setRooms(roomsPayload);
  }, [operationDay]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);

      try {
        await fetchDashboard();
      } catch (error) {
        if (isMounted) {
          console.error(error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [fetchDashboard]);

  const roomById = useMemo(() => new Map(rooms.map((room) => [room.id, room])), [rooms]);

  const metrics = summary ?? {
    operationDay,
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    cleaningRooms: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    outstandingPayments: 0,
    occupancyRate: 0,
  };

  const occupancySeries = trends?.occupancySeries ?? [];
  const revenueSeries = trends?.revenueSeries ?? [];

  const recentBookingRows = useMemo<RecentBookingRow[]>(() => {
    return [...bookings]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 5)
      .map((booking) => {
        const room = roomById.get(booking.roomId);

        return {
          id: booking.id,
          bookingCode: booking.code,
          guestName: booking.guest.name,
          guestPhone: booking.guest.phone,
          roomNumber: room ? room.number : "N/A",
          status: booking.status,
          totalAmount: booking.totalAmount,
          checkInDate: booking.checkInDate,
        };
      });
  }, [bookings, roomById]);

  const recentCheckIns = useMemo<CheckInItem[]>(() => {
    return bookings
      .filter((booking) => booking.status === "confirmed" && booking.checkInDate >= operationDay)
      .sort((left, right) => left.checkInDate.localeCompare(right.checkInDate))
      .slice(0, 5)
      .map((booking) => {
        const room = roomById.get(booking.roomId);

        return {
          id: booking.id,
          guestName: booking.guest.name,
          guestPhone: booking.guest.phone,
          roomNumber: room?.number ?? "N/A",
          roomStatus: room?.status ?? "maintenance",
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
        };
      });
  }, [bookings, operationDay, roomById]);

  const alerts = useMemo<AlertRow[]>(() => {
    const checkoutTodayAlerts: AlertRow[] = bookings
      .filter((booking) => booking.status !== "cancelled" && booking.checkOutDate === operationDay)
      .map((booking) => {
        const room = roomById.get(booking.roomId);

        return {
          id: `checkout-${booking.id}`,
          category: "checkout",
          subject: booking.guest.name,
          detail: `${booking.guest.phone ? `${booking.guest.phone} • ` : ""}Room ${room?.number ?? "N/A"} checks out today (${dateLabel(operationDay)})`,
          status: statusLabel(booking.status),
        };
      });

    const paymentAlerts: AlertRow[] = bookings
      .filter(
        (booking) =>
          booking.status !== "cancelled" &&
          (booking.paymentStatus === "unpaid" || booking.paymentStatus === "partial"),
      )
      .map((booking) => {
        return {
          id: `payment-${booking.id}`,
          category: "payment",
          subject: booking.guest.name,
          detail: `${formatCurrency(booking.remainingAmount)} pending for booking ${booking.code}`,
          status: booking.paymentStatus === "partial" ? "Partially Paid" : "Unpaid",
        };
      });

    const cleaningRoomAlerts: AlertRow[] = rooms
      .filter((room) => room.status === "cleaning")
      .map((room) => ({
        id: `cleaning-${room.id}`,
        category: "cleaning",
        subject: `Room ${room.number}`,
        detail: "Room is marked for cleaning before next check-in",
        status: "Cleaning",
      }));

    return [...checkoutTodayAlerts, ...paymentAlerts, ...cleaningRoomAlerts];
  }, [bookings, operationDay, roomById, rooms]);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Operations Overview</h1>
        <p className="mt-1 text-sm text-slate-500">
          Real-time snapshot of room occupancy, check-ins, and revenue performance.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Rooms"
          value={isLoading ? "--" : String(metrics.totalRooms)}
          description="Inventory in system"
        />
        <MetricCard
          title="Occupied"
          value={isLoading ? "--" : String(metrics.occupiedRooms)}
          change={{ value: `${metrics.occupancyRate}%`, direction: "up", label: "occupancy rate" }}
        />
        <MetricCard
          title="Available"
          value={isLoading ? "--" : String(metrics.availableRooms)}
          description="Ready for new bookings"
        />
        <MetricCard
          title="Needs Cleaning"
          value={isLoading ? "--" : String(metrics.cleaningRooms)}
          description="Rooms pending turnover"
        />
        <MetricCard
          title="Today's Revenue"
          value={isLoading ? "--" : formatCurrency(metrics.todayRevenue)}
          description={`Operational date: ${dateLabel(operationDay)}`}
        />
        <MetricCard
          title="Monthly Revenue"
          value={isLoading ? "--" : formatCurrency(metrics.monthlyRevenue)}
          description={`Collected in ${monthLabel(operationDay.slice(0, 7))}`}
        />
        <MetricCard
          title="Outstanding Payments"
          value={isLoading ? "--" : formatCurrency(metrics.outstandingPayments)}
          description="Open booking balances"
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h2 className="text-base font-semibold text-slate-900">Operational Alerts</h2>
          <p className="text-sm text-slate-500">
            Highlights check-outs due today, unresolved payments, and rooms currently in cleaning.
          </p>
        </div>

        <DataTable<AlertRow>
          columns={[
            {
              key: "category",
              header: "Alert Type",
              render: (row) => (
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${alertCategoryStyles(row.category)}`}
                >
                  {alertCategoryLabel(row.category)}
                </span>
              ),
            },
            {
              key: "subject",
              header: "Subject",
              render: (row) => row.subject,
            },
            {
              key: "detail",
              header: "Detail",
              render: (row) => <span className="text-sm text-slate-600">{row.detail}</span>,
            },
            {
              key: "status",
              header: "Status",
              align: "right",
              render: (row) =>
                row.category === "cleaning" ? (
                  <StatusBadge status="cleaning" />
                ) : (
                  <span className="text-xs font-medium text-slate-700">{row.status}</span>
                ),
            },
          ]}
          data={alerts}
          getRowKey={(row) => row.id}
          isLoading={isLoading}
          emptyTitle="No active alerts"
          emptyDescription="All operations are currently up to date."
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartWrapper
          title="Occupancy Rate"
          description="Last 7 operational days"
          isLoading={isLoading}
          minHeightClassName="min-h-[300px]"
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={occupancySeries}>
              <defs>
                <linearGradient id="occupancy-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0f766e" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip formatter={(value) => `${toNumber(value)}%`} />
              <Area
                type="monotone"
                dataKey="occupancyRate"
                stroke="#0f766e"
                fill="url(#occupancy-fill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper
          title="Revenue Trend"
          description="Collected payments for the last 7 days"
          isLoading={isLoading}
          minHeightClassName="min-h-[300px]"
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueSeries}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              />
              <Tooltip formatter={(value) => formatCurrency(toNumber(value))} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#1d4ed8"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#1d4ed8" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-slate-900">Recent Bookings</h2>
            <p className="text-sm text-slate-500">Latest reservations and booking statuses.</p>
          </div>

          <DataTable<RecentBookingRow>
            columns={[
              {
                key: "booking",
                header: "Booking",
                render: (row) => (
                  <div>
                    <p className="font-medium text-slate-900">{row.bookingCode}</p>
                    <p className="text-xs text-slate-500">Check-in {dateLabel(row.checkInDate)}</p>
                  </div>
                ),
              },
              {
                key: "guest",
                header: "Guest",
                render: (row) => (
                  <div>
                    <p className="font-medium text-slate-900">{row.guestName}</p>
                    {row.guestPhone ? <p className="text-xs text-slate-500">{row.guestPhone}</p> : null}
                  </div>
                ),
              },
              {
                key: "room",
                header: "Room",
                align: "center",
                render: (row) => row.roomNumber,
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles(row.status)}`}
                  >
                    {statusLabel(row.status)}
                  </span>
                ),
              },
              {
                key: "amount",
                header: "Total",
                align: "right",
                render: (row) => formatCurrency(row.totalAmount),
              },
            ]}
            data={recentBookingRows}
            getRowKey={(row) => row.id}
            isLoading={isLoading}
            emptyTitle="No recent bookings"
            emptyDescription="Bookings will appear here as they are created."
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-slate-900">Upcoming Check-ins</h2>
            <p className="text-sm text-slate-500">Guests arriving from today onwards.</p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={`checkin-loading-${index}`} className="rounded-lg border border-slate-200 p-3">
                  <div className="h-4 animate-pulse rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : recentCheckIns.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
              <p className="text-sm font-medium text-slate-700">No upcoming check-ins</p>
              <p className="mt-1 text-sm text-slate-500">New arrivals will be listed here.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentCheckIns.map((item) => (
                <li key={item.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{item.guestName}</p>
                    <StatusBadge status={item.roomStatus} />
                  </div>
                  {item.guestPhone ? <p className="mt-1 text-xs text-slate-500">{item.guestPhone}</p> : null}
                  <p className="mt-1 text-sm text-slate-600">Room {item.roomNumber}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {dateLabel(item.checkInDate)} - {dateLabel(item.checkOutDate)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
