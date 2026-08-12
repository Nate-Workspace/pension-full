import type {
  PublicPensionResponse,
  PublicRoomResponse,
  SiteConfigResponse,
  SiteContentResponse,
} from "@repo/contracts";

import { fetchPublicJson } from "./server-api";

export type PublicHomeData = {
  pension: PublicPensionResponse;
  siteContent: SiteContentResponse;
  rooms: PublicRoomResponse[];
  isOffline: boolean;
};

const EMPTY_SITE_CONFIG: SiteConfigResponse = {
  pensionName: "",
  tagline: "",
  heroImageUrl: "",
  heroHeadline: "",
  heroSubtext: "",
  aboutDescription: "",
  cancellationPolicy: "",
  termsText: "",
  privacyText: "",
  mapEmbedUrl: "",
  mapLat: "",
  mapLng: "",
  allowOnlineBookings: true,
  sameDayBookingCutoffTime: "18:00",
  contactPhone: "",
  contactEmail: "",
  address: "",
  city: "",
};

function createFallbackPension(): PublicPensionResponse {
  return {
    pensionName: "StayFlow Guesthouse",
    tagline: "",
    contactPhone: "",
    contactEmail: "",
    address: "",
    city: "",
    defaultCheckInTime: "14:00",
    defaultCheckOutTime: "11:00",
  };
}

function createFallbackSiteContent(): SiteContentResponse {
  return {
    config: { ...EMPTY_SITE_CONFIG },
    pages: {},
    gallery: [],
    amenities: [],
    faqs: [],
    attractions: [],
  };
}

async function fetchPublicJsonSafe<T>(path: string): Promise<T | null> {
  try {
    return await fetchPublicJson<T>(path);
  } catch {
    return null;
  }
}

export async function loadPublicHomeData(): Promise<PublicHomeData> {
  const [pension, siteContent, rooms] = await Promise.all([
    fetchPublicJsonSafe<PublicPensionResponse>("/public/pension"),
    fetchPublicJsonSafe<SiteContentResponse>("/public/site-content"),
    fetchPublicJsonSafe<PublicRoomResponse[]>("/public/rooms"),
  ]);

  const resolvedPension = pension ?? createFallbackPension();
  const resolvedSiteContent = siteContent ?? createFallbackSiteContent();
  const resolvedRooms = rooms ?? [];

  return {
    pension: resolvedPension,
    siteContent: resolvedSiteContent,
    rooms: resolvedRooms,
    isOffline: pension === null || siteContent === null || rooms === null,
  };
}

export async function loadPublicPensionName(): Promise<string> {
  const pension = await fetchPublicJsonSafe<PublicPensionResponse>("/public/pension");
  return pension?.pensionName || createFallbackPension().pensionName;
}
