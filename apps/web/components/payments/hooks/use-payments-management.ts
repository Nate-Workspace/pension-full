import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import {
  fetchPaymentsData,
  parsePositiveInteger,
  type MethodFilter,
  type PaymentsSummaryResponse,
} from "../services/payments-service";

export function usePaymentsManagement() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get("search")?.trim() ?? "";
  const methodFilter = (searchParams.get("method") as MethodFilter | null) ?? "all";
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const pageSize = parsePositiveInteger(searchParams.get("pageSize"), 10);

  const { data, isLoading, error } = useQuery({
    queryKey: ["payments", { query, methodFilter, page, pageSize }],
    queryFn: async () => fetchPaymentsData({ page, pageSize, query, methodFilter }),
  });

  useEffect(() => {
    if (searchParams.get("page") && searchParams.get("pageSize")) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", searchParams.get("page") ?? "1");
    params.set("pageSize", searchParams.get("pageSize") ?? "10");

    const nextQuery = params.toString();
    router.replace(nextQuery.length > 0 ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  const updateUrlState = (nextParams: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(nextParams).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        params.delete(key);
        return;
      }

      params.set(key, String(value));
    });

    const nextQuery = params.toString();
    router.replace(nextQuery.length > 0 ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  const loadError = error instanceof Error ? error.message : error ? "Unable to load payments data." : null;

  const paymentRows = useMemo(() => data?.paymentRows ?? [], [data]);
  const summaries = useMemo<PaymentsSummaryResponse>(
    () =>
      data?.summaries ?? {
        operationDay: new Date().toISOString().slice(0, 10),
        dailyCollected: 0,
        monthlyCollected: 0,
        outstandingBalances: 0,
        unpaidCount: 0,
        partialCount: 0,
      },
    [data],
  );
  const dailyTrend = useMemo(() => data?.dailyTrend ?? [], [data]);
  const methodTrend = useMemo(() => data?.methodTrend ?? [], [data]);

  return {
    query,
    methodFilter,
    page,
    pageSize,
    isLoading,
    loadError,
    paymentRows,
    summaries,
    dailyTrend,
    methodTrend,
    totalPages: data?.meta.totalPages ?? 0,
    updateUrlState,
  };
}
