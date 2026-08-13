import type {
  PublicPensionResponse,
  PublicRoomAvailabilityResponse,
  PublicRoomResponse,
  SiteContentResponse,
} from "@repo/contracts";

import { fetchPublicJson } from "./server-api";
import { getCalendarQueryRange } from "./public-calendar";
import { startOfMonthUTC } from "@/components/rooms/[id]/utils";
import {
  loadPublicHomeData,
  type PublicHomeData,
} from "./public-home-data";

export type PublicSiteData = PublicHomeData;

export async function loadPublicSiteData(): Promise<PublicSiteData> {
  return loadPublicHomeData();
}

async function fetchPublicJsonSafe<T>(path: string): Promise<T | null> {
  try {
    return await fetchPublicJson<T>(path);
  } catch {
    return null;
  }
}

export async function loadPublicRoomDetail(roomId: string): Promise<{
  siteData: PublicSiteData;
  room: PublicRoomResponse | null;
  initialAvailability: PublicRoomAvailabilityResponse | null;
}> {
  const siteData = await loadPublicSiteData();
  const room = await fetchPublicJsonSafe<PublicRoomResponse>(
    `/public/rooms/${roomId}`,
  );

  let initialAvailability: PublicRoomAvailabilityResponse | null = null;

  if (room) {
    const now = new Date();
    const viewMonth = startOfMonthUTC(now.getUTCFullYear(), now.getUTCMonth());
    const { from, to } = getCalendarQueryRange(viewMonth);

    initialAvailability = await fetchPublicJsonSafe<PublicRoomAvailabilityResponse>(
      `/public/rooms/${roomId}/availability?${new URLSearchParams({ from, to }).toString()}`,
    );
  }

  return { siteData, room, initialAvailability };
}

export type { PublicPensionResponse, PublicRoomResponse, SiteContentResponse };
