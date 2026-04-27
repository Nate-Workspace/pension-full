import type { Dispatch, SetStateAction } from "react";
import type { Room } from "@/data";
import { FormSurface, LoadingSpinner, SelectInput } from "@/components/ui";

import type { BookingFormState } from "../hooks/use-bookings-management";

type Props = {
  isOpen: boolean;
  rooms: Room[];
  formState: BookingFormState;
  formError: string | null;
  isDirty: boolean;
  isSaving: boolean;
  isLoadingRooms: boolean;
  hasValidDateRange: boolean;
  nights: number;
  totalAmount: number;
  onClose: () => void;
  onSave: () => void;
  onFormStateChange: Dispatch<SetStateAction<BookingFormState>>;
};

function RequiredLabel({ children }: { children: string }) {
  return (
    <span className="text-sm font-medium text-slate-700">
      {children}
      <span className="ml-1 text-rose-600">*</span>
    </span>
  );
}

export function BookingFormDrawer({
  isOpen,
  rooms,
  formState,
  formError,
  isDirty,
  isSaving,
  isLoadingRooms,
  hasValidDateRange,
  nights,
  totalAmount,
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
      description="Update reservation details and guest information."
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
      <div className="space-y-5">
        <label className="space-y-1.5">
          <RequiredLabel>Guest Name</RequiredLabel>
          <input
            type="text"
            value={formState.guestName}
            onChange={(event) => onFormStateChange((prev) => ({ ...prev, guestName: event.target.value }))}
            disabled={isSaving}
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
          />
        </label>

        <label className="space-y-1.5">
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Guest Phone</span>
            <input
              type="text"
              value={formState.guestPhone}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, guestPhone: event.target.value }))}
              disabled={isSaving}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>

          <label className="space-y-1.5">
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

        <label className="space-y-1.5">
          <RequiredLabel>Room</RequiredLabel>
          <SelectInput
            value={formState.roomId}
            onChange={(event) => onFormStateChange((prev) => ({ ...prev, roomId: event.target.value }))}
            disabled={isSaving || !hasValidDateRange || isLoadingRooms || rooms.length === 0}
            className="h-10 w-full"
          >
            {!hasValidDateRange ? (
              <option value="">Select valid check-in and check-out first</option>
            ) : null}
            {hasValidDateRange && isLoadingRooms ? <option value="">Loading available rooms...</option> : null}
            {hasValidDateRange && !isLoadingRooms && rooms.length === 0 ? (
              <option value="">No rooms available for selected dates</option>
            ) : null}
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                Room {room.number} ({room.type}) - {room.pricePerNight.toLocaleString("en-US")} Birr/night
              </option>
            ))}
          </SelectInput>
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <RequiredLabel>Check-in Date</RequiredLabel>
            <input
              type="date"
              value={formState.checkInDate}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, checkInDate: event.target.value }))}
              disabled={isSaving}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>

          <label className="space-y-1.5">
            <RequiredLabel>Check-out Date</RequiredLabel>
            <input
              type="date"
              value={formState.checkOutDate}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, checkOutDate: event.target.value }))}
              disabled={isSaving}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <RequiredLabel>Paid Amount</RequiredLabel>
            <input
              type="number"
              min={0}
              value={formState.paidAmount}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, paidAmount: event.target.value }))}
              disabled={isSaving}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>

          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Booking Amount</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{totalAmount.toLocaleString("en-US")} Birr</p>
            <p className="text-xs text-slate-600">{nights > 0 ? `${nights} night${nights > 1 ? "s" : ""}` : "0 nights"}</p>
          </div>
        </div>

        {formError ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>
        ) : null}
      </div>
    </FormSurface>
  );
}
