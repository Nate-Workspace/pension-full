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

import type { PaymentMethod } from "@/data";
import { ChartWrapper, DataTable, MetricCard } from "@/components/ui";
import { apiFetch } from "@/lib/api-client";

type MethodFilter = "all" | PaymentMethod;

type DailyPoint = {
  label: string;
  value: number;
};

type MethodPoint = {
  method: string;
  value: number;
};

type PaymentStatus = "paid" | "partial" | "unpaid";

type PaymentsResponseRow = {
  id: string;
  bookingId: string;
  roomId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt?: string;
  reference: string;
  bookingCode: string;
  guestName: string;
  guestPhone?: string;
  roomNumber: string;
  outstanding: number;
};

type PaymentsSummaryResponse = {
  operationDay: string;
  dailyCollected: number;
  monthlyCollected: number;
  outstandingBalances: number;
  unpaidCount: number;
  partialCount: number;
};

type PaymentsTrendsResponse = {
  operationDay: string;
  daily: Array<DailyPoint & { day: string }>;
  byMethod: Array<{ method: PaymentMethod; value: number }>;
};

type ApiErrorPayload = {
  message?: string | string[];
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

function methodLabel(method: PaymentMethod): string {
  return method === "mobile_money" ? "Mobile Money" : "Cash";
}

function paymentStatusStyle(status: PaymentStatus): string {
  if (status === "paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "partial") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

function paymentStatusLabel(status: PaymentStatus): string {
  if (status === "paid") {
    return "Paid";
  }

  if (status === "partial") {
    return "Partial";
  }

  return "Unpaid";
}

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

  if (!payload?.message) {
    return fallback;
  }

  if (Array.isArray(payload.message)) {
    return payload.message[0] ?? fallback;
  }

  return payload.message;
}

export function PaymentsManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const statusFilter: "all" | PaymentStatus = "all";

  const [paymentRows, setPaymentRows] = useState<PaymentsResponseRow[]>([]);
  const [summaries, setSummaries] = useState<PaymentsSummaryResponse>({
    operationDay: new Date().toISOString().slice(0, 10),
    dailyCollected: 0,
    monthlyCollected: 0,
    outstandingBalances: 0,
    unpaidCount: 0,
    partialCount: 0,
  });
  const [dailyTrend, setDailyTrend] = useState<DailyPoint[]>([]);
  const [methodTrend, setMethodTrend] = useState<MethodPoint[]>([]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const [paymentsResponse, summaryResponse, trendsResponse] = await Promise.all([
          apiFetch("/payments", {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }),
          apiFetch("/payments/summary", {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }),
          apiFetch("/payments/trends", {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }),
        ]);

        if (!paymentsResponse.ok) {
          throw new Error(await getErrorMessage(paymentsResponse, `Failed to load payments (${paymentsResponse.status}).`));
        }

        if (!summaryResponse.ok) {
          throw new Error(await getErrorMessage(summaryResponse, `Failed to load payment summary (${summaryResponse.status}).`));
        }

        if (!trendsResponse.ok) {
          throw new Error(await getErrorMessage(trendsResponse, `Failed to load payment trends (${trendsResponse.status}).`));
        }

        const [paymentsPayload, summaryPayload, trendsPayload] = await Promise.all([
          paymentsResponse.json() as Promise<PaymentsResponseRow[]>,
          summaryResponse.json() as Promise<PaymentsSummaryResponse>,
          trendsResponse.json() as Promise<PaymentsTrendsResponse>,
        ]);

        if (!isMounted) {
          return;
        }

        setPaymentRows(
          [...paymentsPayload].sort((left, right) => {
            const leftDate = left.paidAt ?? "";
            const rightDate = right.paidAt ?? "";
            return rightDate.localeCompare(leftDate);
          }),
        );
        setSummaries(summaryPayload);
        setDailyTrend(
          [...trendsPayload.daily].sort((left, right) => {
            return left.day.localeCompare(right.day);
          }).map((entry) => ({
            label: entry.label,
            value: entry.value,
          })),
        );
        setMethodTrend(
          trendsPayload.byMethod.map((entry) => ({
            method: methodLabel(entry.method),
            value: entry.value,
          })),
        );
      } catch (error) {
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : "Unable to load payments data.");
          setPaymentRows([]);
          setDailyTrend([]);
          setMethodTrend([]);
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
  }, []);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return paymentRows.filter((row) => {
      if (methodFilter !== "all" && row.method !== methodFilter) {
        return false;
      }

      if (statusFilter !== "all" && row.status !== statusFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        row.reference.toLowerCase().includes(normalizedQuery) ||
        row.bookingCode.toLowerCase().includes(normalizedQuery) ||
        row.guestName.toLowerCase().includes(normalizedQuery) ||
        paymentStatusLabel(row.status).toLowerCase().includes(normalizedQuery) ||
        row.roomNumber.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [methodFilter, paymentRows, query, statusFilter]);

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
        <MetricCard title="Outstanding" value={formatMoney(summaries.outstandingBalances)} />
        <MetricCard title="Unpaid Records" value={String(summaries.unpaidCount)} />
        <MetricCard title="Partial Payments" value={String(summaries.partialCount)} />
      </section>

      {loadError ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {loadError}
        </section>
      ) : null}

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
              render: (row) => (row.paidAt ? toDayLabel(row.paidAt.slice(0, 10)) : "Pending"),
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
