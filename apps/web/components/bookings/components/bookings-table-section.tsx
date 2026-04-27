"use client";

import { useMemo, useState } from "react";
import type { Booking, Room } from "@/data";
import { ConfirmDialog, DataTable, SelectInput } from "@/components/ui";

import {
  bookingStatusLabel,
  bookingStatusStyle,
  formatDate,
  formatMoney,
} from "../hooks/use-bookings-management";
import type { BookingFilter } from "../services/bookings-service";

function paymentStatusStyle(status: Booking["paymentStatus"]): string {
  if (status === "paid") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "partial") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

function paymentStatusLabel(status: Booking["paymentStatus"]): string {
  if (status === "paid") {
    return "Paid";
  }

  if (status === "partial") {
    return "Partial";
  }

  return "Unpaid";
}

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
  pendingCheckoutBookingId?: string;
  pendingCancelBookingId?: string;
  updateUrlState: (nextParams: Record<string, string | number | undefined>) => void;
  onCheckoutBooking: (bookingId: string) => void;
  onEditBooking: (booking: Booking) => void;
  onCancelBooking: (bookingId: string) => void;
};

type ActionType = "checkout" | "edit" | "cancel";

type ConfirmAction =
  | {
      action: "checkout" | "cancel";
      booking: Booking;
    }
  | null;

function getAvailableActions(status: Booking["status"]): ActionType[] {
  if (status === "active") {
    return ["checkout", "edit", "cancel"];
  }

  if (status === "upcoming") {
    return ["edit", "cancel"];
  }

  return [];
}

function actionLabel(action: ActionType): string {
  if (action === "checkout") {
    return "Checkout";
  }

  if (action === "edit") {
    return "Edit";
  }

  return "Cancel";
}

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
  pendingCheckoutBookingId,
  pendingCancelBookingId,
  updateUrlState,
  onCheckoutBooking,
  onEditBooking,
  onCancelBooking,
}: Props) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const confirmCopy = useMemo(() => {
    if (!confirmAction) {
      return null;
    }

    if (confirmAction.action === "checkout") {
      const hasOutstanding = confirmAction.booking.remainingAmount > 0;
      return {
        title: "Confirm Checkout",
        description: hasOutstanding
          ? `This booking has ${formatMoney(confirmAction.booking.remainingAmount)} remaining. Continue checkout?`
          : "Are you sure you want to check out this booking?",
        confirmText: "Checkout",
      };
    }

    return {
      title: "Confirm Cancel",
      description: "Are you sure you want to cancel this booking?",
      confirmText: "Cancel Booking",
    };
  }, [confirmAction]);

  const handleActionSelect = (booking: Booking, action: string) => {
    if (action === "edit") {
      onEditBooking(booking);
      return;
    }

    if (action === "checkout" || action === "cancel") {
      setConfirmAction({ action, booking });
    }
  };

  const handleConfirmAction = () => {
    if (!confirmAction) {
      return;
    }

    if (confirmAction.action === "checkout") {
      onCheckoutBooking(confirmAction.booking.id);
    } else {
      onCancelBooking(confirmAction.booking.id);
    }

    setConfirmAction(null);
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => updateUrlState({ search: event.target.value, page: 1 })}
          placeholder="Search by guest, phone, room"
          className="h-10 w-full max-w-sm rounded-md border border-slate-200 px-3 text-sm text-slate-700"
        />

        <SelectInput
          value={statusFilter}
          onChange={(event) => updateUrlState({ status: event.target.value, page: 1 })}
          className="h-10 w-[10.5rem]"
        >
          <option value="active">Active</option>
          <option value="upcoming">Upcoming</option>
          <option value="checked_out">Checked Out</option>
          <option value="canceled">Canceled</option>
          <option value="all">All statuses</option>
        </SelectInput>
      </div>

      <DataTable<Booking>
        columns={[
          {
            key: "guest",
            header: "Guest Info",
            render: (booking) => (
              <div>
                <p className="font-medium text-slate-900">{booking.guest.name}</p>
                <p className="text-xs text-slate-500">{booking.guest.phone ?? "No phone"}</p>
                <p className="text-xs text-slate-500">Handled by: {booking.handledBy ?? "Unassigned"}</p>
              </div>
            ),
          },
          {
            key: "room",
            header: "Room",
            render: (booking) => {
              const room = roomById.get(booking.roomId);
              if (!room) {
                return "N/A";
              }

              return room.name ? `${room.number} (${room.name})` : `Room ${room.number}`;
            },
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
            key: "paymentStatus",
            header: "Payment Status",
            render: (booking) => (
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${paymentStatusStyle(booking.paymentStatus)}`}
              >
                {paymentStatusLabel(booking.paymentStatus)}
              </span>
            ),
          },
          {
            key: "paid",
            header: "Paid",
            align: "right",
            render: (booking) => formatMoney(booking.paidAmount),
          },
          {
            key: "remaining",
            header: "Remaining",
            align: "right",
            render: (booking) => formatMoney(booking.remainingAmount),
          },
          {
            key: "actions",
            header: "Actions",
            align: "right",
            render: (booking) => (
              <div className="flex justify-end gap-2">
                {(() => {
                  const actions = getAvailableActions(booking.status);
                  const isCheckoutPending = pendingCheckoutBookingId === booking.id;
                  const isCancelPending = pendingCancelBookingId === booking.id;
                  const isRowBusy = isCheckoutPending || isCancelPending;

                  return (
                    <SelectInput
                      value=""
                      disabled={isRowBusy || actions.length === 0}
                      onChange={(event) => handleActionSelect(booking, event.target.value)}
                      className="h-8 min-w-[9rem] text-xs"
                      wrapperClassName="min-w-[9rem]"
                    >
                      <option value="" disabled>
                        {isCheckoutPending ? "Checking out..." : isCancelPending ? "Cancelling..." : "Actions"}
                      </option>
                      {actions.length === 0 ? (
                        <option value="view-only">View only</option>
                      ) : (
                        actions.map((action) => (
                          <option key={action} value={action}>
                            {actionLabel(action)}
                          </option>
                        ))
                      )}
                    </SelectInput>
                  );
                })()}
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

      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmCopy?.title ?? "Confirm Action"}
        description={confirmCopy?.description ?? "Are you sure?"}
        cancelText="Keep"
        confirmText={confirmCopy?.confirmText ?? "Confirm"}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />
    </section>
  );
}
