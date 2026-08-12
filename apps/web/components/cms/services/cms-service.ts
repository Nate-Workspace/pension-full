import { apiFetch } from "@/lib/api-client";
import type { CmsPageSummary, CmsPagesResponse } from "@repo/contracts";

export type { CmsPageSummary };

export async function fetchCmsPages(): Promise<CmsPagesResponse> {
  const response = await apiFetch("/cms/pages", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load CMS pages (${response.status}).`);
  }

  return (await response.json()) as CmsPagesResponse;
}

export function getCmsPreviewHref(slug: CmsPageSummary["slug"]): string {
  switch (slug) {
    case "home":
      return "/";
    case "rooms":
      return "/contact";
    case "gallery":
      return "/gallery";
    case "about":
      return "/about";
    case "amenities":
      return "/amenities";
    case "attractions":
      return "/attractions";
    case "contact":
      return "/contact";
    case "faq":
      return "/faq";
    default:
      return "/";
  }
}
