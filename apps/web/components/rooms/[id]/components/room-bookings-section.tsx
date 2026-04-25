import { DataTable } from "@/components/ui";
import type { RoomBookingRow } from "../types";
import {
  bookingStatusLabel,
  bookingStatusStyle,
  formatDate,
  formatMoney,
  paymentStatusLabel,
  paymentStatusStyle,
} from "../utils";

type RoomBookingsSectionProps = {
  bookingRows: RoomBookingRow[];
};

export function RoomBookingsSection({ bookingRows }: RoomBookingsSectionProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-slate-900">Room Bookings</h2>
        <p className="text-sm text-slate-500">All bookings associated with this room.</p>
      </div>

      <DataTable<RoomBookingRow>
        columns={[
          {
            key: "booking",
            header: "Booking",
            render: (row) => (
              <div>
                <p className="font-medium text-slate-900">{row.code}</p>
                <p className="text-xs text-slate-500">
                  {row.guestName}
                  {row.guestPhone ? ` • ${row.guestPhone}` : ""}
                </p>
              </div>
            ),
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
            key: "nights",
            header: "Nights",
            align: "center",
            render: (row) => row.nights,
          },
          {
            key: "status",
            header: "Booking Status",
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
            header: "Payment",
            render: (row) => (
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentStatusStyle(row.paymentStatus)}`}
              >
                {paymentStatusLabel(row.paymentStatus)}
              </span>
            ),
          },
          {
            key: "amount",
            header: "Total",
            align: "right",
            render: (row) => formatMoney(row.totalAmount),
          },
          {
            key: "remaining",
            header: "Remaining",
            align: "right",
            render: (row) => formatMoney(row.remainingAmount),
          },
        ]}
        data={bookingRows}
        getRowKey={(row) => row.id}
        emptyTitle="No bookings for this room"
        emptyDescription="Create a booking to start tracking this room's timeline."
      />
    </section>
  );
}
