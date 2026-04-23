import type { Dispatch, SetStateAction } from "react";
import type { PensionInfoForm } from "../services/settings-service";

type Props = {
  pensionInfo: PensionInfoForm;
  isLoading: boolean;
  isSavingProfile: boolean;
  onChange: Dispatch<SetStateAction<PensionInfoForm>>;
  onSave: () => void;
};

export function PensionInfoSection({ pensionInfo, isLoading, isSavingProfile, onChange, onSave }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">Guest House Information</h2>
        <p className="mt-1 text-sm text-slate-500">General profile details used across the system.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Guest House Name</span>
          <input
            type="text"
            value={pensionInfo.pensionName}
            onChange={(event) => onChange((prev) => ({ ...prev, pensionName: event.target.value }))}
            disabled={isLoading || isSavingProfile}
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Owner Name</span>
          <input
            type="text"
            value={pensionInfo.ownerName}
            onChange={(event) => onChange((prev) => ({ ...prev, ownerName: event.target.value }))}
            disabled={isLoading || isSavingProfile}
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Phone</span>
          <input
            type="text"
            value={pensionInfo.contactPhone}
            onChange={(event) => onChange((prev) => ({ ...prev, contactPhone: event.target.value }))}
            disabled={isLoading || isSavingProfile}
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
          />
        </label>

        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            value={pensionInfo.contactEmail}
            onChange={(event) => onChange((prev) => ({ ...prev, contactEmail: event.target.value }))}
            disabled={isLoading || isSavingProfile}
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
          />
        </label>

        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Address</span>
          <input
            type="text"
            value={pensionInfo.address}
            onChange={(event) => onChange((prev) => ({ ...prev, address: event.target.value }))}
            disabled={isLoading || isSavingProfile}
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
          />
        </label>

        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">City</span>
          <input
            type="text"
            value={pensionInfo.city}
            onChange={(event) => onChange((prev) => ({ ...prev, city: event.target.value }))}
            disabled={isLoading || isSavingProfile}
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
          />
        </label>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={isLoading || isSavingProfile}
          className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
        >
          Save Profile
        </button>
      </div>
    </div>
  );
}
