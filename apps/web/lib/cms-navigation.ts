import type { CmsPageSlug } from "@repo/contracts";

export type CmsNavSlug = CmsPageSlug | "global";

export type CmsNavItem = {
  slug: CmsNavSlug;
  label: string;
  previewHref: string;
  description: string;
};

export const cmsNavigation: CmsNavItem[] = [
  {
    slug: "global",
    label: "Global",
    previewHref: "/",
    description: "Site-wide settings, policies, and booking rules.",
  },
  {
    slug: "home",
    label: "Home",
    previewHref: "/",
    description: "Hero copy, featured rooms, and homepage sections.",
  },
  {
    slug: "rooms",
    label: "Rooms",
    previewHref: "/rooms",
    description: "Rooms listing page headline and intro copy.",
  },
  {
    slug: "gallery",
    label: "Gallery",
    previewHref: "/gallery",
    description: "Photo gallery items and captions.",
  },
  {
    slug: "about",
    label: "About",
    previewHref: "/about",
    description: "Guesthouse story and owner information.",
  },
  {
    slug: "amenities",
    label: "Amenities",
    previewHref: "/amenities",
    description: "Amenities list shown on the public site.",
  },
  {
    slug: "attractions",
    label: "Attractions",
    previewHref: "/attractions",
    description: "Nearby places and local highlights.",
  },
  {
    slug: "contact",
    label: "Contact",
    previewHref: "/contact",
    description: "Contact details and map shown to guests.",
  },
  {
    slug: "faq",
    label: "FAQ",
    previewHref: "/faq",
    description: "Frequently asked questions.",
  },
];

export function getCmsNavItem(slug: string): CmsNavItem | undefined {
  return cmsNavigation.find((item) => item.slug === slug);
}

export function isCmsNavSlug(slug: string): slug is CmsNavSlug {
  return cmsNavigation.some((item) => item.slug === slug);
}

export function getCmsEditorHref(slug: CmsNavSlug): string {
  return `/cms/${slug}`;
}
