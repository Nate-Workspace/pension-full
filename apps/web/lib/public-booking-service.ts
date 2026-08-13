import type {
  PublicBookingCheckoutInput,
  PublicBookingCheckoutResponse,
  PublicBookingLookupResponse,
} from "@repo/contracts";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/$/, "");

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(payload.message)) {
      return payload.message.join(" ");
    }
    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }
  } catch {
    // Fall through.
  }

  return fallback;
}

export async function checkoutPublicBooking(
  input: PublicBookingCheckoutInput,
): Promise<PublicBookingCheckoutResponse> {
  const response = await fetch(buildApiUrl("/public/bookings/checkout"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, `Booking request failed (${response.status}).`),
    );
  }

  return (await response.json()) as PublicBookingCheckoutResponse;
}

export async function lookupPublicBooking(
  code: string,
  contact: string,
): Promise<PublicBookingLookupResponse> {
  const params = new URLSearchParams({
    code: code.trim(),
    contact: contact.trim(),
  });
  const response = await fetch(
    buildApiUrl(`/public/bookings/lookup?${params.toString()}`),
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      await readErrorMessage(
        response,
        response.status === 404
          ? "No booking matched that reference and contact details."
          : `Lookup failed (${response.status}).`,
      ),
    );
  }

  return (await response.json()) as PublicBookingLookupResponse;
}
