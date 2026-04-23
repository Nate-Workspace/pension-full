"use client";

import { MetricCard } from "@/components/ui";

import { PaymentsTableSection } from "./components/payments-table-section";
import { PaymentsTrendsSection } from "./components/payments-trends-section";
import { usePaymentsManagement } from "./hooks/use-payments-management";
import { formatMoney } from "./services/payments-service";

export function PaymentsManagement() {
  const {
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
    totalPages,
    updateUrlState,
  } = usePaymentsManagement();

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

      <PaymentsTrendsSection isLoading={isLoading} dailyTrend={dailyTrend} methodTrend={methodTrend} />

      <PaymentsTableSection
        query={query}
        methodFilter={methodFilter}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        paymentRows={paymentRows}
        isLoading={isLoading}
        updateUrlState={updateUrlState}
      />
    </div>
  );
}
