import type { PublicRoomAvailabilityResponse } from "@repo/contracts";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/$/, "");

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function fetchPublicRoomAvailability(
  roomId: string,
  from: string,
  to: string,
): Promise<PublicRoomAvailabilityResponse> {
  const params = new URLSearchParams({ from, to });
  const response = await fetch(
    buildApiUrl(`/public/rooms/${roomId}/availability?${params.toString()}`),
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to load room availability (${response.status}).`);
  }

  return (await response.json()) as PublicRoomAvailabilityResponse;
}
