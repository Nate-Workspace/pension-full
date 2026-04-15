"use client";

import { useMemo, useState } from "react";

import { rooms } from "@/data";
import type { RoomType } from "@/data";

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

function computeAveragePriceByType(type: RoomType): number {
  const scopedRooms = rooms.filter((room) => room.type === type);

  if (scopedRooms.length === 0) {
    return 0;
  }

  const sum = scopedRooms.reduce((total, room) => total + room.pricePerNight, 0);
  return Math.round(sum / scopedRooms.length);
}

export function SettingsManagement() {
  const [pensionInfo, setPensionInfo] = useState<PensionInfoForm>({
    pensionName: "Hillside Guest House",
    ownerName: "Guest House Owner",
    contactPhone: "+221 77 000 9988",
    contactEmail: "admin@hillsideguesthouse.org",
    address: "Bole Brass",
    city: "Addis Ababa",
  });

  const [roomPricing, setRoomPricing] = useState<RoomPricingForm>({
    single: String(computeAveragePriceByType("single")),
    double: String(computeAveragePriceByType("double")),
    vip: String(computeAveragePriceByType("vip")),
  });

  const [basicConfig, setBasicConfig] = useState<BasicConfigForm>({
    defaultCheckInTime: "14:00",
    defaultCheckOutTime: "11:00",
    allowWalkInBookings: true,
    autoMarkRoomCleaningAfterCheckout: true,
    requireIdBeforeCheckIn: true,
    sendPaymentReminders: true,
  });

  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const pricingPreview = useMemo(() => {
    return {
      single: Number(roomPricing.single) || 0,
      double: Number(roomPricing.double) || 0,
      vip: Number(roomPricing.vip) || 0,
    };
  }, [roomPricing]);

  const showSaved = (message: string) => {
    setSaveMessage(message);
    window.setTimeout(() => {
      setSaveMessage(null);
    }, 1800);
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
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Address</span>
              <input
                type="text"
                value={pensionInfo.address}
                onChange={(event) => setPensionInfo((prev) => ({ ...prev, address: event.target.value }))}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">City</span>
              <input
                type="text"
                value={pensionInfo.city}
                onChange={(event) => setPensionInfo((prev) => ({ ...prev, city: event.target.value }))}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              />
            </label>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => showSaved("Pension information saved.")}
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
              onClick={() => showSaved("Room pricing settings updated.")}
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
            />
            Send payment reminders
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => showSaved("Basic configuration saved.")}
            className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            Save Configuration
          </button>
        </div>
      </section>
    </div>
  );
}
