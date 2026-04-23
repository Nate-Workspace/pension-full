"use client";

import { BasicConfigSection } from "./components/basic-config-section";
import { PensionInfoSection } from "./components/pension-info-section";
import { PricingSection } from "./components/pricing-section";
import { useSettingsManagement } from "./hooks/use-settings-management";

export function SettingsManagement() {
  const {
    pensionInfo,
    setPensionInfo,
    roomPricing,
    setRoomPricing,
    basicConfig,
    setBasicConfig,
    pricingPreview,
    isLoading,
    isSavingProfile,
    isSavingPricing,
    isSavingConfig,
    formError,
    saveMessage,
    handleSavePensionInfo,
    handleSavePricing,
    handleSaveOperationalPreferences,
  } = useSettingsManagement();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure pension profile, room pricing, and core operational preferences.
        </p>
      </section>

      {saveMessage ? (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {saveMessage}
        </section>
      ) : null}

      {formError ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError}
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <PensionInfoSection
          pensionInfo={pensionInfo}
          isLoading={isLoading}
          isSavingProfile={isSavingProfile}
          onChange={setPensionInfo}
          onSave={handleSavePensionInfo}
        />

        <PricingSection
          roomPricing={roomPricing}
          pricingPreview={pricingPreview}
          isLoading={isLoading}
          isSavingPricing={isSavingPricing}
          onChange={setRoomPricing}
          onSave={handleSavePricing}
        />
      </section>

      <BasicConfigSection
        basicConfig={basicConfig}
        isLoading={isLoading}
        isSavingConfig={isSavingConfig}
        onChange={setBasicConfig}
        onSave={handleSaveOperationalPreferences}
      />
    </div>
  );
}
