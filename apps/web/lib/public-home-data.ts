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
    pages: {
      home: [],
      rooms: [],
      about: [],
      contact: [],
    },
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

export type PublicLayoutData = {
  pensionName: string;
  tagline: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  city: string;
};

export async function loadPublicLayoutData(): Promise<PublicLayoutData> {
  const [pension, siteContent] = await Promise.all([
    fetchPublicJsonSafe<PublicPensionResponse>("/public/pension"),
    fetchPublicJsonSafe<SiteContentResponse>("/public/site-content"),
  ]);

  const resolvedPension = pension ?? createFallbackPension();
  const resolvedConfig = siteContent?.config ?? EMPTY_SITE_CONFIG;

  return {
    pensionName:
      resolvedConfig.pensionName.trim() || resolvedPension.pensionName,
    tagline: resolvedConfig.tagline.trim() || resolvedPension.tagline,
    contactPhone:
      resolvedConfig.contactPhone.trim() || resolvedPension.contactPhone,
    contactEmail:
      resolvedConfig.contactEmail.trim() || resolvedPension.contactEmail,
    address: resolvedConfig.address.trim() || resolvedPension.address,
    city: resolvedConfig.city.trim() || resolvedPension.city,
  };
}

export async function loadPublicPensionName(): Promise<string> {
  const layout = await loadPublicLayoutData();
  return layout.pensionName;
}
