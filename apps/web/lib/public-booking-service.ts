import type {
  PublicBookingCheckoutInput,
  PublicBookingCheckoutResponse,
} from "@repo/contracts";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/$/, "");

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(payload.message)) {
      return payload.message.join(" ");
    }
    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }
  } catch {
    // Fall through to generic message.
  }

  return `Booking request failed (${response.status}).`;
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
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as PublicBookingCheckoutResponse;
}
