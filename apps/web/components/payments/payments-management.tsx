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

import type { Payment, PaymentMethod } from "@/data";
import { useOperationsData } from "@/components/providers/operations-provider";
import { ChartWrapper, DataTable, MetricCard } from "@/components/ui";
import {
  getCollectedForDay,
  getCollectedForMonth,
  getOutstandingPayments,
  getPaymentIssueCounts,
} from "@/lib/operations";

type MethodFilter = "all" | PaymentMethod;

type DailyPoint = {
  label: string;
  value: number;
};

type MethodPoint = {
  method: string;
  value: number;
};

function formatMoney(value: number): string {
  return `${value.toLocaleString("en-US")} Birr`;
}

function toDayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function addDays(day: string, days: number): string {
  const value = new Date(`${day}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function methodLabel(method: PaymentMethod): string {
  return method === "mobile_money" ? "Mobile Money" : "Cash";
}

function paymentStatusStyle(status: Payment["status"]): string {
  if (status === "paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "partial") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

function paymentStatusLabel(status: Payment["status"]): string {
  if (status === "paid") {
    return "Paid";
  }

  if (status === "partial") {
    return "Partial";
  }

  return "Unpaid";
}

export function PaymentsManagement() {
  const { bookings, payments, rooms, operationDay } = useOperationsData();
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  const roomById = useMemo(() => new Map(rooms.map((item) => [item.id, item])), [rooms]);

  const paidByBooking = useMemo(() => {
    return payments.reduce<Map<string, number>>((map, payment) => {
      const current = map.get(payment.bookingId) ?? 0;
      map.set(payment.bookingId, current + payment.amount);
      return map;
    }, new Map<string, number>());
  }, [payments]);

  const paymentRows = useMemo(() => {
    return payments
      .map((payment) => {
        const booking = bookings.find((item) => item.id === payment.bookingId);
        const room = roomById.get(payment.roomId);
        const bookingTotal = booking?.totalAmount ?? 0;
        const paidTotal = paidByBooking.get(payment.bookingId) ?? 0;

        return {
          ...payment,
          bookingCode: booking?.code ?? "N/A",
          guestName: booking?.guest.name ?? "Unknown",
          guestPhone: booking?.guest.phone,
          roomNumber: room?.number ?? "N/A",
          outstanding: Math.max(bookingTotal - paidTotal, 0),
          paidDate: payment.paidAt?.slice(0, 10),
        };
      })
      .sort((left, right) => {
        const leftDate = left.paidDate ?? "0000-00-00";
        const rightDate = right.paidDate ?? "0000-00-00";
        return rightDate.localeCompare(leftDate);
      });
  }, [bookings, paidByBooking, payments, roomById]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return paymentRows.filter((row) => {
      if (methodFilter !== "all" && row.method !== methodFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        row.reference.toLowerCase().includes(normalizedQuery) ||
        row.bookingCode.toLowerCase().includes(normalizedQuery) ||
        row.guestName.toLowerCase().includes(normalizedQuery) ||
        row.roomNumber.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [methodFilter, paymentRows, query]);

  const summaries = useMemo(() => {
    const monthPrefix = operationDay.slice(0, 7);
    const counts = getPaymentIssueCounts(bookings);

    const dailyCollected = getCollectedForDay(bookings, operationDay);
    const monthlyCollected = getCollectedForMonth(bookings, monthPrefix);
    const outstandingTotal = getOutstandingPayments(bookings);

    return {
      dailyCollected,
      monthlyCollected,
      unpaidCount: counts.unpaid,
      partialCount: counts.partial,
      outstandingTotal,
    };
  }, [bookings, operationDay]);

  const dailyTrend = useMemo<DailyPoint[]>(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const day = addDays(operationDay, index - 6);
      const value = getCollectedForDay(bookings, day);

      return {
        label: toDayLabel(day),
        value,
      };
    });
  }, [bookings, operationDay]);

  const methodTrend = useMemo<MethodPoint[]>(() => {
    const cash = payments
      .filter((payment) => payment.method === "cash")
      .reduce((sum, payment) => sum + payment.amount, 0);

    const mobileMoney = payments
      .filter((payment) => payment.method === "mobile_money")
      .reduce((sum, payment) => sum + payment.amount, 0);

    return [
      { method: "Cash", value: cash },
      { method: "Mobile Money", value: mobileMoney },
    ];
  }, [payments]);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Payments & Revenue</h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor collections, payment methods, and outstanding balances across bookings.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Daily Collected" value={formatMoney(summaries.dailyCollected)} />
        <MetricCard title="Monthly Collected" value={formatMoney(summaries.monthlyCollected)} />
        <MetricCard title="Outstanding" value={formatMoney(summaries.outstandingTotal)} />
        <MetricCard title="Unpaid Records" value={String(summaries.unpaidCount)} />
        <MetricCard title="Partial Payments" value={String(summaries.partialCount)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartWrapper
          title="Daily Revenue Trend"
          description="Collected payments over the last 7 days"
          isLoading={isLoading}
          minHeightClassName="min-h-[300px]"
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              />
              <Tooltip formatter={(value) => formatMoney(Number(value ?? 0))} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#0f766e"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#0f766e" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper
          title="Revenue by Method"
          description="Cash vs Mobile Money collection"
          isLoading={isLoading}
          minHeightClassName="min-h-[300px]"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={methodTrend}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
              <XAxis dataKey="method" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              />
              <Tooltip formatter={(value) => formatMoney(Number(value ?? 0))} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#1d4ed8" />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by reference, booking, guest or room"
            className="h-10 w-full max-w-sm rounded-md border border-slate-200 px-3 text-sm text-slate-700"
          />

          <select
            value={methodFilter}
            onChange={(event) => setMethodFilter(event.target.value as MethodFilter)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="mobile_money">Mobile Money</option>
          </select>
        </div>

        <DataTable<(typeof filteredRows)[number]>
          columns={[
            {
              key: "reference",
              header: "Reference",
              render: (row) => (
                <div>
                  <p className="font-medium text-slate-900">{row.reference}</p>
                  <p className="text-xs text-slate-500">{row.bookingCode}</p>
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
              render: (row) => `Room ${row.roomNumber}`,
            },
            {
              key: "method",
              header: "Method",
              render: (row) => methodLabel(row.method),
            },
            {
              key: "status",
              header: "Status",
              render: (row) => (
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentStatusStyle(row.status)}`}
                >
                  {paymentStatusLabel(row.status)}
                </span>
              ),
            },
            {
              key: "amount",
              header: "Paid",
              align: "right",
              render: (row) => formatMoney(row.amount),
            },
            {
              key: "outstanding",
              header: "Outstanding",
              align: "right",
              render: (row) => formatMoney(row.outstanding),
            },
            {
              key: "date",
              header: "Paid At",
              align: "right",
              render: (row) => (row.paidDate ? toDayLabel(row.paidDate) : "Pending"),
            },
          ]}
          data={filteredRows}
          getRowKey={(row) => row.id}
          getRowClassName={(row) => (row.status === "unpaid" ? "bg-rose-50/60" : "")}
          isLoading={isLoading}
          emptyTitle="No payment records"
          emptyDescription="Try changing your search query or method filter."
        />
      </section>
    </div>
  );
}
