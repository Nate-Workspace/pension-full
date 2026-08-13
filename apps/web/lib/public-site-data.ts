import type {
  PublicPensionResponse,
  PublicRoomResponse,
  SiteContentResponse,
} from "@repo/contracts";

import { fetchPublicJson } from "./server-api";
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
}> {
  const siteData = await loadPublicSiteData();
  const room = await fetchPublicJsonSafe<PublicRoomResponse>(
    `/public/rooms/${roomId}`,
  );

  return { siteData, room };
}

export type { PublicPensionResponse, PublicRoomResponse, SiteContentResponse };
