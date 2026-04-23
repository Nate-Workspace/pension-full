import type { PaymentMethod } from "@/data";
import { apiFetch } from "@/lib/api-client";

export type MethodFilter = "all" | PaymentMethod;

export type DailyPoint = {
  label: string;
  value: number;
};

export type PaymentStatus = "paid" | "partial" | "unpaid";

export type PaymentsResponseRow = {
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

export type PaymentsSummaryResponse = {
  operationDay: string;
  dailyCollected: number;
  monthlyCollected: number;
  outstandingBalances: number;
  unpaidCount: number;
  partialCount: number;
};

export type PaymentsTrendsResponse = {
  operationDay: string;
  daily: Array<DailyPoint & { day: string }>;
  byMethod: Array<{ method: PaymentMethod; value: number }>;
};

export type ApiErrorPayload = {
  message?: string | string[];
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export function isPaginatedResponse<T>(value: unknown): value is PaginatedResponse<T> {
  return typeof value === "object" && value !== null && "data" in value && "meta" in value;
}

export function parsePositiveInteger(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  return searchParams.toString();
}

export function formatMoney(value: number): string {
  return `${value.toLocaleString("en-US")} Birr`;
}

export function toDayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function methodLabel(method: PaymentMethod): string {
  return method === "mobile_money" ? "Mobile Money" : "Cash";
}

export function paymentStatusStyle(status: PaymentStatus): string {
  if (status === "paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "partial") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

export function paymentStatusLabel(status: PaymentStatus): string {
  if (status === "paid") {
    return "Paid";
  }

  if (status === "partial") {
    return "Partial";
  }

  return "Unpaid";
}

export async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

  if (!payload?.message) {
    return fallback;
  }

  if (Array.isArray(payload.message)) {
    return payload.message[0] ?? fallback;
  }

  return payload.message;
}

export async function fetchPaymentsData(params: {
  page: number;
  pageSize: number;
  query: string;
  methodFilter: MethodFilter;
}): Promise<{
  paymentRows: PaymentsResponseRow[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  summaries: PaymentsSummaryResponse;
  dailyTrend: DailyPoint[];
  methodTrend: Array<{ method: string; value: number }>;
}> {
  const queryString = buildQueryString({
    page: params.page,
    pageSize: params.pageSize,
    search: params.query.length > 0 ? params.query : undefined,
    method: params.methodFilter !== "all" ? params.methodFilter : undefined,
  });

  const [paymentsResponse, summaryResponse, trendsResponse] = await Promise.all([
    apiFetch(`/payments${queryString.length > 0 ? `?${queryString}` : ""}`, {
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
    paymentsResponse.json() as Promise<PaginatedResponse<PaymentsResponseRow> | PaymentsResponseRow[]>,
    summaryResponse.json() as Promise<PaymentsSummaryResponse>,
    trendsResponse.json() as Promise<PaymentsTrendsResponse>,
  ]);

  const paymentRows = Array.isArray(paymentsPayload)
    ? (() => {
        const startIndex = (params.page - 1) * params.pageSize;
        return paymentsPayload.slice(startIndex, startIndex + params.pageSize);
      })()
    : isPaginatedResponse<PaymentsResponseRow>(paymentsPayload)
      ? paymentsPayload.data
      : [];

  const meta = Array.isArray(paymentsPayload)
    ? {
        page: params.page,
        pageSize: params.pageSize,
        total: paymentsPayload.length,
        totalPages: paymentsPayload.length > 0 ? Math.ceil(paymentsPayload.length / params.pageSize) : 0,
      }
    : isPaginatedResponse<PaymentsResponseRow>(paymentsPayload)
      ? paymentsPayload.meta
      : {
          page: params.page,
          pageSize: params.pageSize,
          total: 0,
          totalPages: 0,
        };

  return {
    paymentRows,
    meta,
    summaries: summaryPayload,
    dailyTrend: [...trendsPayload.daily]
      .sort((left, right) => left.day.localeCompare(right.day))
      .map((entry) => ({
        label: entry.label,
        value: entry.value,
      })),
    methodTrend: trendsPayload.byMethod.map((entry) => ({
      method: methodLabel(entry.method),
      value: entry.value,
    })),
  };
}
