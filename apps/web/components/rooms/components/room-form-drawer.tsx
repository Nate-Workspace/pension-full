import type { Dispatch, SetStateAction } from "react";
import type { RoomType } from "@/data";
import { FormSurface, LoadingSpinner, SelectInput } from "@/components/ui";
import { ROOM_STATUS_LABELS, type RoomStatus } from "@/lib/types/status";

import { ROOM_MUTABLE_STATUSES, ROOM_TYPES, roomTypeLabel, type RoomFormState } from "../hooks/use-rooms-management";

type Props = {
  isOpen: boolean;
  formState: RoomFormState;
  formError: string | null;
  isDirty: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
  onFormStateChange: Dispatch<SetStateAction<RoomFormState>>;
};

export function RoomFormDrawer({
  isOpen,
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
      title={formState.id ? `Edit Room ${formState.number}` : "Add New Room"}
      description="Update room details and operational status."
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
              "Create Room"
            )}
          </button>
        </div>
      )}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Room Number</span>
            <input
              type="text"
              value={formState.number}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, number: event.target.value }))}
              disabled={isSaving}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              placeholder="e.g. 401"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Floor</span>
            <input
              type="number"
              min={1}
              value={formState.floor}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, floor: event.target.value }))}
              disabled={isSaving}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Room Type</span>
            <SelectInput
              value={formState.type}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, type: event.target.value as RoomType }))}
              disabled={isSaving}
              className="h-10 w-full"
            >
              {ROOM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {roomTypeLabel(type)}
                </option>
              ))}
            </SelectInput>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <SelectInput
              value={formState.status}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, status: event.target.value as RoomStatus }))}
              disabled={isSaving || formState.status === "occupied"}
              className="h-10 w-full"
            >
              {formState.status === "occupied" ? (
                <option value="occupied">{ROOM_STATUS_LABELS.occupied}</option>
              ) : null}

              {ROOM_MUTABLE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {ROOM_STATUS_LABELS[status]}
                </option>
              ))}
            </SelectInput>
            {formState.status === "occupied" ? (
              <p className="text-xs text-slate-500">Occupied is booking-driven and cannot be manually set.</p>
            ) : null}
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Capacity</span>
            <input
              type="number"
              min={1}
              value={formState.capacity}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, capacity: event.target.value }))}
              disabled={isSaving}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Price / Night (Birr)</span>
            <input
              type="number"
              min={1000}
              step={500}
              value={formState.pricePerNight}
              onChange={(event) => onFormStateChange((prev) => ({ ...prev, pricePerNight: event.target.value }))}
              disabled={isSaving}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>
        </div>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Assigned to (optional)</span>
          <input
            type="text"
            value={formState.assignedTo}
            onChange={(event) => onFormStateChange((prev) => ({ ...prev, assignedTo: event.target.value }))}
            disabled={isSaving}
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            placeholder="e.g. Housekeeping A"
          />
        </label>

        {formError ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>
        ) : null}
      </div>
    </FormSurface>
  );
}
