import type { Booking, Room } from "@/data";
import { DataTable } from "@/components/ui";

import {
  bookingStatusLabel,
  bookingStatusStyle,
  formatDate,
  formatMoney,
} from "../hooks/use-bookings-management";
import type { BookingFilter } from "../services/bookings-service";

type Props = {
  search: string;
  statusFilter: BookingFilter;
  page: number;
  pageSize: number;
  pageBookings: Booking[];
  roomById: Map<string, Room>;
  isLoading: boolean;
  totalPages: number;
  actionMessage: string | null;
  updateUrlState: (nextParams: Record<string, string | number | undefined>) => void;
  onCheckoutBooking: (bookingId: string) => void;
  onEditBooking: (booking: Booking) => void;
  onCancelBooking: (bookingId: string) => void;
  onSetRoomAvailable: (roomId: string) => void;
};

export function BookingsTableSection({
  search,
  statusFilter,
  page,
  pageSize,
  pageBookings,
  roomById,
  isLoading,
  totalPages,
  actionMessage,
  updateUrlState,
  onCheckoutBooking,
  onEditBooking,
  onCancelBooking,
  onSetRoomAvailable,
}: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => updateUrlState({ search: event.target.value, page: 1 })}
          placeholder="Search by code, guest, room"
          className="h-10 w-full max-w-sm rounded-md border border-slate-200 px-3 text-sm text-slate-700"
        />

        <select
          value={statusFilter}
          onChange={(event) => updateUrlState({ status: event.target.value, page: 1 })}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
        >
          <option value="all">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <DataTable<Booking>
        columns={[
          {
            key: "code",
            header: "Booking",
            render: (booking) => (
              <div>
                <p className="font-medium text-slate-900">{booking.code}</p>
                <p className="text-xs text-slate-500">{formatDate(booking.checkInDate)}</p>
              </div>
            ),
          },
          {
            key: "guest",
            header: "Guest",
            render: (booking) => (
              <div>
                <p className="font-medium text-slate-900">{booking.guest.name}</p>
                {booking.guest.phone ? <p className="text-xs text-slate-500">{booking.guest.phone}</p> : null}
                {booking.handledBy ? <p className="text-xs text-slate-500">Handled by: {booking.handledBy}</p> : null}
              </div>
            ),
          },
          {
            key: "room",
            header: "Room",
            align: "center",
            render: (booking) => `Room ${roomById.get(booking.roomId)?.number ?? "N/A"}`,
          },
          {
            key: "stay",
            header: "Stay",
            render: (booking) => (
              <span className="text-xs text-slate-600">
                {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (booking) => (
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${bookingStatusStyle(booking.status)}`}
              >
                {bookingStatusLabel(booking.status)}
              </span>
            ),
          },
          {
            key: "amount",
            header: "Amount",
            align: "right",
            render: (booking) => formatMoney(booking.totalAmount),
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (booking) => (
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onCheckoutBooking(booking.id)}
                  disabled={booking.status === "cancelled"}
                  className="h-8 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700 enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Check-out
                </button>
                <button
                  type="button"
                  onClick={() => onEditBooking(booking)}
                  className="h-8 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onCancelBooking(booking.id)}
                  disabled={booking.status === "cancelled"}
                  className="h-8 rounded-md border border-rose-200 px-3 text-xs font-medium text-rose-700 enabled:hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                {roomById.get(booking.roomId)?.status === "cleaning" ? (
                  <button
                    type="button"
                    onClick={() => onSetRoomAvailable(booking.roomId)}
                    className="h-8 rounded-md border border-emerald-200 px-3 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                  >
                    Set Available
                  </button>
                ) : null}
              </div>
            ),
          },
        ]}
        data={pageBookings}
        getRowKey={(booking) => booking.id}
        isLoading={isLoading}
        emptyTitle="No bookings found"
        emptyDescription="Try adjusting filters or create a new booking."
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={(nextPage) => updateUrlState({ page: nextPage })}
        onPageSizeChange={(nextPageSize) => updateUrlState({ pageSize: nextPageSize, page: 1 })}
      />

      {actionMessage ? (
        <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{actionMessage}</p>
      ) : null}
    </section>
  );
}
