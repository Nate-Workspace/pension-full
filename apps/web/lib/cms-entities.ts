import type {
  CmsAmenityInput,
  CmsAmenityUpdateInput,
  CmsAttractionInput,
  CmsAttractionUpdateInput,
  CmsFaqInput,
  CmsFaqUpdateInput,
  CmsGalleryItemInput,
  CmsGalleryItemUpdateInput,
  SiteAmenity,
  SiteAttraction,
  SiteFaq,
  SiteGalleryItem,
} from "@repo/contracts";

export type CmsEntityKind = "gallery" | "amenities" | "faqs" | "attractions";

export type CmsEntityField = {
  key: string;
  label: string;
  required?: boolean;
  multiline?: boolean;
  type?: "text" | "url" | "number";
  placeholder?: string;
};

export type CmsEntityConfig = {
  kind: CmsEntityKind;
  slug: "gallery" | "amenities" | "faq" | "attractions";
  label: string;
  description: string;
  emptyLabel: string;
  fields: CmsEntityField[];
  defaultItem: Record<string, string | number>;
};

export type CmsEntityRecord =
  | SiteGalleryItem
  | SiteAmenity
  | SiteFaq
  | SiteAttraction;

export const cmsGalleryConfig: CmsEntityConfig = {
  kind: "gallery",
  slug: "gallery",
  label: "Gallery",
  description: "Add, edit, or remove photos shown on the public gallery page.",
  emptyLabel: "No gallery photos yet.",
  fields: [
    { key: "imageUrl", label: "Image URL", required: true, type: "url", placeholder: "https://..." },
    { key: "caption", label: "Caption", multiline: true },
    { key: "sortOrder", label: "Sort order", type: "number" },
  ],
  defaultItem: { imageUrl: "", caption: "", sortOrder: 0 },
};

export const cmsAmenitiesConfig: CmsEntityConfig = {
  kind: "amenities",
  slug: "amenities",
  label: "Amenities",
  description: "Manage amenities displayed on the public amenities page.",
  emptyLabel: "No amenities yet.",
  fields: [
    { key: "name", label: "Name", required: true },
    { key: "icon", label: "Icon / emoji", placeholder: "WiFi" },
    { key: "description", label: "Description", multiline: true },
    { key: "sortOrder", label: "Sort order", type: "number" },
  ],
  defaultItem: { name: "", icon: "", description: "", sortOrder: 0 },
};

export const cmsFaqsConfig: CmsEntityConfig = {
  kind: "faqs",
  slug: "faq",
  label: "FAQ",
  description: "Manage questions and answers on the public FAQ page.",
  emptyLabel: "No FAQ entries yet.",
  fields: [
    { key: "question", label: "Question", required: true },
    { key: "answer", label: "Answer", required: true, multiline: true },
    { key: "sortOrder", label: "Sort order", type: "number" },
  ],
  defaultItem: { question: "", answer: "", sortOrder: 0 },
};

export const cmsAttractionsConfig: CmsEntityConfig = {
  kind: "attractions",
  slug: "attractions",
  label: "Attractions",
  description: "Manage nearby places shown on the public attractions page.",
  emptyLabel: "No attractions yet.",
  fields: [
    { key: "name", label: "Name", required: true },
    { key: "description", label: "Description", multiline: true },
    { key: "distance", label: "Distance", placeholder: "1.2 km" },
    { key: "imageUrl", label: "Image URL", type: "url", placeholder: "https://..." },
    { key: "sortOrder", label: "Sort order", type: "number" },
  ],
  defaultItem: { name: "", description: "", distance: "", imageUrl: "", sortOrder: 0 },
};

export type CmsEntityInput =
  | CmsGalleryItemInput
  | CmsAmenityInput
  | CmsFaqInput
  | CmsAttractionInput;

export type CmsEntityUpdateInput =
  | CmsGalleryItemUpdateInput
  | CmsAmenityUpdateInput
  | CmsFaqUpdateInput
  | CmsAttractionUpdateInput;
