import type { Dispatch, SetStateAction } from "react";
import { LoadingSpinner } from "@/components/ui";
import type { BasicConfigForm } from "../services/settings-service";

type Props = {
  basicConfig: BasicConfigForm;
  isLoading: boolean;
  isSavingConfig: boolean;
  onChange: Dispatch<SetStateAction<BasicConfigForm>>;
  onSave: () => void;
};

export function BasicConfigSection({ basicConfig, isLoading, isSavingConfig, onChange, onSave }: Props) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">Basic Configuration</h2>
        <p className="mt-1 text-sm text-slate-500">Control default operations and policy toggles.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Default Check-in Time</span>
          <input
            type="time"
            value={basicConfig.defaultCheckInTime}
            onChange={(event) => onChange((prev) => ({ ...prev, defaultCheckInTime: event.target.value }))}
            disabled={isLoading || isSavingConfig}
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Default Check-out Time</span>
          <input
            type="time"
            value={basicConfig.defaultCheckOutTime}
            onChange={(event) => onChange((prev) => ({ ...prev, defaultCheckOutTime: event.target.value }))}
            disabled={isLoading || isSavingConfig}
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={basicConfig.allowWalkInBookings}
            onChange={(event) => onChange((prev) => ({ ...prev, allowWalkInBookings: event.target.checked }))}
            disabled={isLoading || isSavingConfig}
          />
          Allow walk-in bookings
        </label>

        <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={basicConfig.autoMarkRoomCleaningAfterCheckout}
            onChange={(event) =>
              onChange((prev) => ({
                ...prev,
                autoMarkRoomCleaningAfterCheckout: event.target.checked,
              }))
            }
            disabled={isLoading || isSavingConfig}
          />
          Auto-mark cleaning after check-out
        </label>

        <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={basicConfig.requireIdBeforeCheckIn}
            onChange={(event) => onChange((prev) => ({ ...prev, requireIdBeforeCheckIn: event.target.checked }))}
            disabled={isLoading || isSavingConfig}
          />
          Require ID before check-in
        </label>

        <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={basicConfig.sendPaymentReminders}
            onChange={(event) => onChange((prev) => ({ ...prev, sendPaymentReminders: event.target.checked }))}
            disabled={isLoading || isSavingConfig}
          />
          Send payment reminders
        </label>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={isLoading || isSavingConfig}
          className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
        >
          {isSavingConfig ? (
            <span className="inline-flex items-center gap-2">
              <LoadingSpinner className="h-3.5 w-3.5" />
              Saving...
            </span>
          ) : (
            "Save Configuration"
          )}
        </button>
      </div>
    </section>
  );
}
