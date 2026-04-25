import type { RoomAnalytics } from "../types";
import { formatMoney } from "../utils";
import { MetricCard } from "@/components/ui";

type RoomMetricsSectionProps = {
  analytics: RoomAnalytics;
  isAdmin: boolean;
};

export function RoomMetricsSection({ analytics, isAdmin }: RoomMetricsSectionProps) {
  return (
    <section className={`grid gap-4 sm:grid-cols-2 ${isAdmin ? "xl:grid-cols-4" : "xl:grid-cols-2"}`}>
      <MetricCard title="Booking Count" value={String(analytics.bookingCount)} description="All-time records" />
      <MetricCard
        title="Occupancy Rate"
        value={`${analytics.occupancyRate}%`}
        description="Based on booked nights window"
      />
      {isAdmin ? <MetricCard title="Revenue Generated" value={formatMoney(analytics.revenueGenerated)} /> : null}
      {isAdmin ? (
        <MetricCard title="Collected Revenue" value={formatMoney(analytics.collectedRevenue)} description="Paid amounts" />
      ) : null}
    </section>
  );
}
