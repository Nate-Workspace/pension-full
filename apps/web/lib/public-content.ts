import type { SiteContentResponse } from "@repo/contracts";

export function getSectionContent(
  siteContent: SiteContentResponse,
  pageSlug: string,
  sectionKey: string,
): string {
  return (
    siteContent.pages[pageSlug as keyof SiteContentResponse["pages"]]?.find(
      (section) => section.sectionKey === sectionKey,
    )?.content ?? ""
  ).trim();
}

export function formatPublicPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPhoneHref(phone: string): string {
  return `tel:${phone.replace(/\s+/g, "")}`;
}
