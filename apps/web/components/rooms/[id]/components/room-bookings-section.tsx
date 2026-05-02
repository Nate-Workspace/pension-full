"use client";

import { useMemo, useState } from "react";

import { DataTable, SelectInput } from "@/components/ui";
import type { RoomBookingRow } from "../types";
import {
  bookingStatusLabel,
  bookingStatusStyle,
  formatDate,
  formatMoney,
  paymentStatusLabel,
  paymentStatusStyle,
} from "../utils";
import type { BookingFilter } from "../../../bookings/services/bookings-service";

type RoomBookingsSectionProps = {
  bookingRows: RoomBookingRow[];
  roomLabel: string;
};

const STATUS_OPTIONS: Array<{ value: BookingFilter; label: string }> = [
  { value: "active", label: "Active" },
  { value: "upcoming", label: "Upcoming" },
  { value: "checked_out", label: "Checked Out" },
  { value: "canceled", label: "Canceled" },
  { value: "all", label: "All statuses" },
];

export function RoomBookingsSection({ bookingRows, roomLabel }: RoomBookingsSectionProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return bookingRows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [row.code, row.guestName, row.guestPhone ?? ""].join(" ").toLowerCase();
      return searchableText.includes(normalizedSearch);
    });
  }, [bookingRows, search, statusFilter]);

  const totalPages = filteredRows.length > 0 ? Math.ceil(filteredRows.length / pageSize) : 0;
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1;
  const pageRows = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [filteredRows, pageSize, safePage]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search by guest, phone, room"
          className="h-10 w-full max-w-sm rounded-md border border-slate-200 px-3 text-sm text-slate-700"
        />

        <SelectInput
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as BookingFilter);
            setPage(1);
          }}
          className="h-10 w-[10.5rem]"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectInput>
      </div>

      <DataTable<RoomBookingRow>
        columns={[
          {
            key: "guest",
            header: "Guest Info",
            render: (row) => (
              <div>
                <p className="font-medium text-slate-900">{row.code}</p>
                <p className="text-xs text-slate-500">
                  {row.guestName}
                  {row.guestPhone ? ` • ${row.guestPhone}` : "No phone"}
                </p>
                <p className="text-xs text-slate-500">Handled by: {row.handledBy ?? "Unassigned"}</p>
              </div>
            ),
          },
          {
            key: "room",
            header: "Room",
            render: () => roomLabel,
          },
          {
            key: "stay",
            header: "Stay",
            render: (row) => (
              <span className="text-xs text-slate-600">
                {formatDate(row.checkInDate)} - {formatDate(row.checkOutDate)}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${bookingStatusStyle(row.status)}`}
              >
                {bookingStatusLabel(row.status)}
              </span>
            ),
          },
          {
            key: "payment",
            header: "Payment Status",
            render: (row) => (
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentStatusStyle(row.paymentStatus)}`}
              >
                {paymentStatusLabel(row.paymentStatus)}
              </span>
            ),
          },
          {
            key: "paid",
            header: "Paid",
            align: "right",
            render: (row) => formatMoney(row.paidAmount),
          },
          {
            key: "remaining",
            header: "Remaining",
            align: "right",
            render: (row) => formatMoney(row.remainingAmount),
          },
        ]}
        data={pageRows}
        getRowKey={(row) => row.id}
        emptyTitle="No room bookings found"
        emptyDescription="Try adjusting the filters or create a booking for this room."
        page={filteredRows.length > 0 ? safePage : undefined}
        pageSize={filteredRows.length > 0 ? pageSize : undefined}
        totalPages={filteredRows.length > 0 ? totalPages : undefined}
        onPageChange={(nextPage) => setPage(nextPage)}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
      />
    </section>
  );
}
