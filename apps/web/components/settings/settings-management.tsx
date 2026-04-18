"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { apiFetch } from "@/lib/api-client";

type PensionInfoForm = {
  pensionName: string;
  ownerName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  city: string;
};

type RoomPricingForm = {
  single: string;
  double: string;
  vip: string;
};

type BasicConfigForm = {
  defaultCheckInTime: string;
  defaultCheckOutTime: string;
  allowWalkInBookings: boolean;
  autoMarkRoomCleaningAfterCheckout: boolean;
  requireIdBeforeCheckIn: boolean;
  sendPaymentReminders: boolean;
};

function toCurrency(value: number): string {
  return `${value.toLocaleString("en-US")} Birr`;
}

type PensionInfoResponse = {
  pensionName: string;
  ownerName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  city: string;
};

type PricingResponse = {
  single: number;
  double: number;
  vip: number;
};

type OperationalPreferencesResponse = {
  defaultCheckInTime: string;
  defaultCheckOutTime: string;
  allowWalkInBookings: boolean;
  autoMarkRoomCleaningAfterCheckout: boolean;
  requireIdBeforeCheckIn: boolean;
  sendPaymentReminders: boolean;
};

type ApiErrorPayload = {
  message?: string | string[];
};

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

  if (!payload?.message) {
    return fallback;
  }

  if (Array.isArray(payload.message)) {
    return payload.message[0] ?? fallback;
  }

  return payload.message;
}

export function SettingsManagement() {
  const saveMessageTimerRef = useRef<number | null>(null);
  const [pensionInfo, setPensionInfo] = useState<PensionInfoForm>({
    pensionName: "",
    ownerName: "",
    contactPhone: "",
    contactEmail: "",
    address: "",
    city: "",
  });

  const [roomPricing, setRoomPricing] = useState<RoomPricingForm>({
    single: "0",
    double: "0",
    vip: "0",
  });

  const [basicConfig, setBasicConfig] = useState<BasicConfigForm>({
    defaultCheckInTime: "",
    defaultCheckOutTime: "",
    allowWalkInBookings: false,
    autoMarkRoomCleaningAfterCheckout: false,
    requireIdBeforeCheckIn: false,
    sendPaymentReminders: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      setIsLoading(true);
      setFormError(null);

      try {
        const [pensionInfoResponse, pricingResponse, operationalResponse] = await Promise.all([
          apiFetch("/settings/pension-info", {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }),
          apiFetch("/settings/pricing", {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }),
          apiFetch("/settings/operational-preferences", {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }),
        ]);

        if (!pensionInfoResponse.ok) {
          throw new Error(`Failed to load pension info (${pensionInfoResponse.status}).`);
        }

        if (!pricingResponse.ok) {
          throw new Error(`Failed to load pricing settings (${pricingResponse.status}).`);
        }

        if (!operationalResponse.ok) {
          throw new Error(`Failed to load operational preferences (${operationalResponse.status}).`);
        }

        const [pensionInfoPayload, pricingPayload, operationalPayload] = await Promise.all([
          pensionInfoResponse.json() as Promise<PensionInfoResponse>,
          pricingResponse.json() as Promise<PricingResponse>,
          operationalResponse.json() as Promise<OperationalPreferencesResponse>,
        ]);

        if (!isMounted) {
          return;
        }

        setPensionInfo(pensionInfoPayload);
        setRoomPricing({
          single: String(pricingPayload.single),
          double: String(pricingPayload.double),
          vip: String(pricingPayload.vip),
        });
        setBasicConfig(operationalPayload);
      } catch (error) {
        if (isMounted) {
          setFormError(error instanceof Error ? error.message : "Unable to load settings.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const pricingPreview = useMemo(() => {
    return {
      single: Number(roomPricing.single) || 0,
      double: Number(roomPricing.double) || 0,
      vip: Number(roomPricing.vip) || 0,
    };
  }, [roomPricing]);

  const showSaved = (message: string) => {
    setSaveMessage(message);

    if (saveMessageTimerRef.current !== null) {
      window.clearTimeout(saveMessageTimerRef.current);
    }

    saveMessageTimerRef.current = window.setTimeout(() => {
      setSaveMessage(null);
    }, 1800);
  };

  useEffect(() => {
    return () => {
      if (saveMessageTimerRef.current !== null) {
        window.clearTimeout(saveMessageTimerRef.current);
      }
    };
  }, []);

  const savePensionInfo = () => {
    void (async () => {
      setIsSavingProfile(true);
      setFormError(null);

      try {
        const response = await apiFetch("/settings/pension-info", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(pensionInfo),
        });

        if (!response.ok) {
          throw new Error(await getErrorMessage(response, `Failed to save pension info (${response.status}).`));
        }

        const payload = (await response.json()) as PensionInfoResponse;
        setPensionInfo(payload);
        showSaved("Pension information saved.");
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Unable to save pension information.");
      } finally {
        setIsSavingProfile(false);
      }
    })();
  };

  const savePricing = () => {
    const single = Number(roomPricing.single);
    const double = Number(roomPricing.double);
    const vip = Number(roomPricing.vip);

    if (!Number.isFinite(single) || !Number.isFinite(double) || !Number.isFinite(vip)) {
      setFormError("Pricing values must be valid numbers.");
      return;
    }

    if (single < 0 || double < 0 || vip < 0) {
      setFormError("Pricing values must not be negative.");
      return;
    }

    void (async () => {
      setIsSavingPricing(true);
      setFormError(null);

      try {
        const response = await apiFetch("/settings/pricing", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            single: Math.round(single),
            double: Math.round(double),
            vip: Math.round(vip),
          }),
        });

        if (!response.ok) {
          throw new Error(await getErrorMessage(response, `Failed to save pricing settings (${response.status}).`));
        }

        const payload = (await response.json()) as PricingResponse;
        setRoomPricing({
          single: String(payload.single),
          double: String(payload.double),
          vip: String(payload.vip),
        });
        showSaved("Room pricing settings updated.");
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Unable to save room pricing.");
      } finally {
        setIsSavingPricing(false);
      }
    })();
  };

  const saveOperationalPreferences = () => {
    void (async () => {
      setIsSavingConfig(true);
      setFormError(null);

      try {
        const response = await apiFetch("/settings/operational-preferences", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(basicConfig),
        });

        if (!response.ok) {
          throw new Error(await getErrorMessage(response, `Failed to save operational preferences (${response.status}).`));
        }

        const payload = (await response.json()) as OperationalPreferencesResponse;
        setBasicConfig(payload);
        showSaved("Basic configuration saved.");
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Unable to save basic configuration.");
      } finally {
        setIsSavingConfig(false);
      }
    })();
  };

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
                onChange={(event) =>
                  setPensionInfo((prev) => ({ ...prev, pensionName: event.target.value }))
                }
                disabled={isLoading || isSavingProfile}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Owner Name</span>
              <input
                type="text"
                value={pensionInfo.ownerName}
                onChange={(event) =>
                  setPensionInfo((prev) => ({ ...prev, ownerName: event.target.value }))
                }
                disabled={isLoading || isSavingProfile}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Phone</span>
              <input
                type="text"
                value={pensionInfo.contactPhone}
                onChange={(event) =>
                  setPensionInfo((prev) => ({ ...prev, contactPhone: event.target.value }))
                }
                disabled={isLoading || isSavingProfile}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={pensionInfo.contactEmail}
                onChange={(event) =>
                  setPensionInfo((prev) => ({ ...prev, contactEmail: event.target.value }))
                }
                disabled={isLoading || isSavingProfile}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Address</span>
              <input
                type="text"
                value={pensionInfo.address}
                onChange={(event) => setPensionInfo((prev) => ({ ...prev, address: event.target.value }))}
                disabled={isLoading || isSavingProfile}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">City</span>
              <input
                type="text"
                value={pensionInfo.city}
                onChange={(event) => setPensionInfo((prev) => ({ ...prev, city: event.target.value }))}
                disabled={isLoading || isSavingProfile}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              />
            </label>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={savePensionInfo}
              disabled={isLoading || isSavingProfile}
              className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              Save Profile
            </button>
          </div>
        </div>

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
                onChange={(event) => setRoomPricing((prev) => ({ ...prev, single: event.target.value }))}
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
                onChange={(event) => setRoomPricing((prev) => ({ ...prev, double: event.target.value }))}
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
                onChange={(event) => setRoomPricing((prev) => ({ ...prev, vip: event.target.value }))}
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
              onClick={savePricing}
              disabled={isLoading || isSavingPricing}
              className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              Save Pricing
            </button>
          </div>
        </div>
      </section>

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
              onChange={(event) =>
                setBasicConfig((prev) => ({ ...prev, defaultCheckInTime: event.target.value }))
              }
              disabled={isLoading || isSavingConfig}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Default Check-out Time</span>
            <input
              type="time"
              value={basicConfig.defaultCheckOutTime}
              onChange={(event) =>
                setBasicConfig((prev) => ({ ...prev, defaultCheckOutTime: event.target.value }))
              }
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
              onChange={(event) =>
                setBasicConfig((prev) => ({ ...prev, allowWalkInBookings: event.target.checked }))
              }
              disabled={isLoading || isSavingConfig}
            />
            Allow walk-in bookings
          </label>

          <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={basicConfig.autoMarkRoomCleaningAfterCheckout}
              onChange={(event) =>
                setBasicConfig((prev) => ({
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
              onChange={(event) =>
                setBasicConfig((prev) => ({ ...prev, requireIdBeforeCheckIn: event.target.checked }))
              }
              disabled={isLoading || isSavingConfig}
            />
            Require ID before check-in
          </label>

          <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={basicConfig.sendPaymentReminders}
              onChange={(event) =>
                setBasicConfig((prev) => ({ ...prev, sendPaymentReminders: event.target.checked }))
              }
              disabled={isLoading || isSavingConfig}
            />
            Send payment reminders
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={saveOperationalPreferences}
            disabled={isLoading || isSavingConfig}
            className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            Save Configuration
          </button>
        </div>
      </section>
    </div>
  );
}
