import type { Dispatch, SetStateAction } from "react";
import { LoadingSpinner } from "@/components/ui";
import type { RoomPricingForm } from "../services/settings-service";
import { toCurrency } from "../services/settings-service";

type Props = {
  roomPricing: RoomPricingForm;
  pricingPreview: { single: number; double: number; vip: number };
  isLoading: boolean;
  isSavingPricing: boolean;
  onChange: Dispatch<SetStateAction<RoomPricingForm>>;
  onSave: () => void;
};

export function PricingSection({
  roomPricing,
  pricingPreview,
  isLoading,
  isSavingPricing,
  onChange,
  onSave,
}: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900">Room Pricing Settings</h2>
        <p className="mt-1 text-sm text-slate-500">Set base nightly pricing by room category.</p>
      </div>

      <div className="space-y-3">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Single Room (Birr)</span>
          <input
            type="number"
            min={1000}
            value={roomPricing.single}
            onChange={(event) => onChange((prev) => ({ ...prev, single: event.target.value }))}
            disabled={isLoading || isSavingPricing}
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Double Room (Birr)</span>
          <input
            type="number"
            min={1000}
            value={roomPricing.double}
            onChange={(event) => onChange((prev) => ({ ...prev, double: event.target.value }))}
            disabled={isLoading || isSavingPricing}
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">VIP Room (Birr)</span>
          <input
            type="number"
            min={1000}
            value={roomPricing.vip}
            onChange={(event) => onChange((prev) => ({ ...prev, vip: event.target.value }))}
            disabled={isLoading || isSavingPricing}
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
          />
        </label>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <p className="font-medium text-slate-900">Pricing Preview</p>
        <p className="mt-1">Single: {toCurrency(pricingPreview.single)}</p>
        <p>Double: {toCurrency(pricingPreview.double)}</p>
        <p>VIP: {toCurrency(pricingPreview.vip)}</p>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={isLoading || isSavingPricing}
          className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
        >
          {isSavingPricing ? (
            <span className="inline-flex items-center gap-2">
              <LoadingSpinner className="h-3.5 w-3.5" />
              Saving...
            </span>
          ) : (
            "Save Pricing"
          )}
        </button>
      </div>
    </div>
  );
}
