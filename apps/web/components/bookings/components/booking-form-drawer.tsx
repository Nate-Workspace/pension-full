import type { Dispatch, SetStateAction } from "react";
import type { Booking, BookingStatus, Room } from "@/data";
import { FormSurface, LoadingSpinner, SelectInput } from "@/components/ui";

import type { BookingFormState } from "../hooks/use-bookings-management";

type Props = {
  isOpen: boolean;
  rooms: Room[];
  formState: BookingFormState;
  formError: string | null;
  isDirty: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
  onFormStateChange: Dispatch<SetStateAction<BookingFormState>>;
};

export function BookingFormDrawer({
  isOpen,
  rooms,
  formState,
  formError,
  isDirty,
  isSaving,
  onClose,
  onSave,
  onFormStateChange,
}: Props) {
  return (
    <FormSurface
      open={isOpen}
      onClose={onClose}
      mode="drawer"
      isDirty={isDirty}
      title={formState.id ? "Edit Booking" : "Create Booking"}
      description="Update reservation details and status."
      footer={({ requestClose }) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={requestClose}
            disabled={isSaving}
            className="h-10 rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            {formState.id ? "Close" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            {isSaving ? (
              <span className="inline-flex items-center gap-2">
                <LoadingSpinner className="h-3.5 w-3.5" />
                Saving...
              </span>
            ) : formState.id ? (
              "Save Changes"
            ) : (
              "Create Booking"
            )}
          </button>
        </div>
      )}
    >
      <div className="space-y-4">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Guest Name</span>
          <input
            type="text"
            value={formState.guestName}
            onChange={(event) => onFormStateChange((prev) => ({ ...prev, guestName: event.target.value }))}
            disabled={isSaving}
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Handled by (optional)</span>
          <input
            type="text"
            value={formState.handledBy}
            onChange={(event) => onFormStateChange((prev) => ({ ...prev, handledBy: event.target.value }))}
            disabled={isSaving}
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
              disabled={isSaving}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">ID Number</span>
            <input
              type="text"
              value={formState.guestIdNumber}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, guestIdNumber: event.target.value }))}
              disabled={isSaving}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>
        </div>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Room</span>
          <SelectInput
            value={formState.roomId}
            onChange={(event) => onFormStateChange((prev) => ({ ...prev, roomId: event.target.value }))}
            disabled={isSaving}
            className="h-10 w-full"
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                Room {room.number} ({room.type})
              </option>
            ))}
          </SelectInput>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Check-in Date</span>
            <input
              type="date"
              value={formState.checkInDate}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, checkInDate: event.target.value }))}
              disabled={isSaving}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Check-out Date</span>
            <input
              type="date"
              value={formState.checkOutDate}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, checkOutDate: event.target.value }))}
              disabled={isSaving}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <SelectInput
              value={formState.status}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, status: event.target.value as BookingStatus }))}
              disabled={isSaving}
              className="h-10 w-full"
            >
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </SelectInput>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Paid Amount</span>
            <input
              type="number"
              min={0}
              value={formState.paidAmount}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, paidAmount: event.target.value }))}
              disabled={isSaving}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Source</span>
            <SelectInput
              value={formState.source}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, source: event.target.value as Booking["source"] }))}
              disabled={isSaving}
              className="h-10 w-full"
            >
              <option value="walk-in">Walk-in</option>
              <option value="phone">Phone</option>
              <option value="website">Website</option>
              <option value="agent">Agent</option>
            </SelectInput>
          </label>
        </div>

        {formError ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>
        ) : null}
      </div>
    </FormSurface>
  );
}
