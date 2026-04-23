import { apiFetch } from "@/lib/api-client";

export type PensionInfoForm = {
  pensionName: string;
  ownerName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  city: string;
};

export type RoomPricingForm = {
  single: string;
  double: string;
  vip: string;
};

export type BasicConfigForm = {
  defaultCheckInTime: string;
  defaultCheckOutTime: string;
  allowWalkInBookings: boolean;
  autoMarkRoomCleaningAfterCheckout: boolean;
  requireIdBeforeCheckIn: boolean;
  sendPaymentReminders: boolean;
};

export function toCurrency(value: number): string {
  return `${value.toLocaleString("en-US")} Birr`;
}

export type PensionInfoResponse = {
  pensionName: string;
  ownerName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  city: string;
};

export type PricingResponse = {
  single: number;
  double: number;
  vip: number;
};

export type OperationalPreferencesResponse = {
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

export async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  if (response.status === 403) {
    return "You do not have permission";
  }

  const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

  if (!payload?.message) {
    return fallback;
  }

  if (Array.isArray(payload.message)) {
    return payload.message[0] ?? fallback;
  }

  return payload.message;
}

export async function fetchSettings(): Promise<{
  pensionInfo: PensionInfoForm;
  roomPricing: RoomPricingForm;
  basicConfig: BasicConfigForm;
}> {
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
    throw new Error(await getErrorMessage(pensionInfoResponse, `Failed to load pension info (${pensionInfoResponse.status}).`));
  }

  if (!pricingResponse.ok) {
    throw new Error(await getErrorMessage(pricingResponse, `Failed to load pricing settings (${pricingResponse.status}).`));
  }

  if (!operationalResponse.ok) {
    throw new Error(
      await getErrorMessage(operationalResponse, `Failed to load operational preferences (${operationalResponse.status}).`),
    );
  }

  const [pensionInfoPayload, pricingPayload, operationalPayload] = await Promise.all([
    pensionInfoResponse.json() as Promise<PensionInfoResponse>,
    pricingResponse.json() as Promise<PricingResponse>,
    operationalResponse.json() as Promise<OperationalPreferencesResponse>,
  ]);

  return {
    pensionInfo: pensionInfoPayload,
    roomPricing: {
      single: String(pricingPayload.single),
      double: String(pricingPayload.double),
      vip: String(pricingPayload.vip),
    },
    basicConfig: operationalPayload,
  };
}

export async function savePensionInfo(input: PensionInfoForm): Promise<PensionInfoForm> {
  const response = await apiFetch("/settings/pension-info", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Failed to save pension info (${response.status}).`));
  }

  return (await response.json()) as PensionInfoResponse;
}

export async function savePricing(input: { single: number; double: number; vip: number }): Promise<RoomPricingForm> {
  const response = await apiFetch("/settings/pricing", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Failed to save pricing settings (${response.status}).`));
  }

  const payload = (await response.json()) as PricingResponse;
  return {
    single: String(payload.single),
    double: String(payload.double),
    vip: String(payload.vip),
  };
}

export async function saveOperationalPreferences(input: BasicConfigForm): Promise<BasicConfigForm> {
  const response = await apiFetch("/settings/operational-preferences", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Failed to save operational preferences (${response.status}).`));
  }

  return (await response.json()) as OperationalPreferencesResponse;
}
