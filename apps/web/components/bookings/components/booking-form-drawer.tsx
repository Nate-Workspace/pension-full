import type { Dispatch, SetStateAction } from "react";
import type { Booking, BookingStatus, Room } from "@/data";
import { FormSurface } from "@/components/ui";

import type { BookingFormState } from "../hooks/use-bookings-management";

type Props = {
  isOpen: boolean;
  rooms: Room[];
  formState: BookingFormState;
  formError: string | null;
  onClose: () => void;
  onSave: () => void;
  onFormStateChange: Dispatch<SetStateAction<BookingFormState>>;
};

export function BookingFormDrawer({ isOpen, rooms, formState, formError, onClose, onSave, onFormStateChange }: Props) {
  return (
    <FormSurface
      open={isOpen}
      onClose={onClose}
      mode="drawer"
      title={formState.id ? "Edit Booking" : "Create Booking"}
      description="Update reservation details and status."
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            {formState.id ? "Save Changes" : "Create Booking"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Guest Name</span>
          <input
            type="text"
            value={formState.guestName}
            onChange={(event) => onFormStateChange((prev) => ({ ...prev, guestName: event.target.value }))}
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Handled by (optional)</span>
          <input
            type="text"
            value={formState.handledBy}
            onChange={(event) => onFormStateChange((prev) => ({ ...prev, handledBy: event.target.value }))}
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            placeholder="e.g. Front Desk A"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Guest Phone</span>
            <input
              type="text"
              value={formState.guestPhone}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, guestPhone: event.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">ID Number</span>
            <input
              type="text"
              value={formState.guestIdNumber}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, guestIdNumber: event.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>
        </div>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Room</span>
          <select
            value={formState.roomId}
            onChange={(event) => onFormStateChange((prev) => ({ ...prev, roomId: event.target.value }))}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800"
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                Room {room.number} ({room.type})
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Check-in Date</span>
            <input
              type="date"
              value={formState.checkInDate}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, checkInDate: event.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Check-out Date</span>
            <input
              type="date"
              value={formState.checkOutDate}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, checkOutDate: event.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select
              value={formState.status}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, status: event.target.value as BookingStatus }))}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800"
            >
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Paid Amount</span>
            <input
              type="number"
              min={0}
              value={formState.paidAmount}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, paidAmount: event.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Source</span>
            <select
              value={formState.source}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, source: event.target.value as Booking["source"] }))}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800"
            >
              <option value="walk-in">Walk-in</option>
              <option value="phone">Phone</option>
              <option value="website">Website</option>
              <option value="agent">Agent</option>
            </select>
          </label>
        </div>

        {formError ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>
        ) : null}
      </div>
    </FormSurface>
  );
}
