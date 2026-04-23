"use client";

import { MetricCard } from "@/components/ui";

import { ReportsChartsSection } from "./components/reports-charts-section";
import { useReportsAnalytics } from "./hooks/use-reports-analytics";
import { formatMoney } from "./services/reports-service";

export function ReportsManagement() {
  const {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    formError,
    validRange,
    isLoading,
    occupancySeries,
    revenueByRoomType,
    mostBookedRooms,
    peakBookingDays,
    summaries,
  } = useReportsAnalytics();

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">
            Analyze occupancy, booking behavior, and revenue performance across selected dates.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-3">
          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="h-10 rounded-md border border-slate-200 px-3 text-sm text-slate-700"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">End Date</span>
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
        <MetricCard title="Average Occupancy" value={`${summaries.averageOccupancy}%`} />
        <MetricCard title="Revenue in Range" value={formatMoney(summaries.totalRevenue)} />
        <MetricCard title="Most Booked Room" value={summaries.topRoom.room} description={`${summaries.topRoom.count} bookings`} />
        <MetricCard title="Peak Booking Day" value={summaries.peakDay.day} description={`${summaries.peakDay.count} check-ins`} />
      </section>

      <ReportsChartsSection
        isLoading={isLoading}
        occupancySeries={occupancySeries}
        revenueByRoomType={revenueByRoomType}
        mostBookedRooms={mostBookedRooms}
        peakBookingDays={peakBookingDays}
      />
    </div>
  );
}
