import { CmsEntityListEditor } from "@/components/cms/editors/cms-entity-list-editor";
import { CmsSectionsEditor } from "@/components/cms/editors/cms-sections-editor";
import {
  cmsAmenitiesConfig,
  cmsAttractionsConfig,
  cmsFaqsConfig,
  cmsGalleryConfig,
} from "@/lib/cms-entities";

const homeFields = [
  {
    key: "heroHeadline",
    label: "Hero headline",
    hint: "Used when global hero headline is empty.",
  },
  {
    key: "heroSubtext",
    label: "Hero subtext",
    hint: "Used when global hero subtext is empty.",
    multiline: true,
  },
  {
    key: "intro",
    label: "Intro copy",
    hint: "Shown in the Plan your stay section.",
    multiline: true,
  },
  {
    key: "ctaCopy",
    label: "CTA copy",
    hint: "Fallback intro text if intro is empty.",
    multiline: true,
  },
] as const;

const roomsFields = [
  {
    key: "headline",
    label: "Page headline",
  },
  {
    key: "intro",
    label: "Intro text",
    multiline: true,
  },
] as const;

export function CmsHomeEditor() {
  return <CmsSectionsEditor slug="home" pageSlug="home" fields={[...homeFields]} />;
}

export function CmsRoomsEditor() {
  return <CmsSectionsEditor slug="rooms" pageSlug="rooms" fields={[...roomsFields]} />;
}

export function CmsGalleryEditor() {
  return <CmsEntityListEditor config={cmsGalleryConfig} />;
}

export function CmsAmenitiesEditor() {
  return <CmsEntityListEditor config={cmsAmenitiesConfig} />;
}

export function CmsAttractionsEditor() {
  return <CmsEntityListEditor config={cmsAttractionsConfig} />;
}

export function CmsFaqEditor() {
  return <CmsEntityListEditor config={cmsFaqsConfig} />;
}
