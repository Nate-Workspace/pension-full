"use client";

import { notFound } from "next/navigation";
import { use } from "react";

import { CmsAboutEditor } from "@/components/cms/editors/cms-about-editor";
import { CmsContactEditor } from "@/components/cms/editors/cms-contact-editor";
import { CmsGlobalEditor } from "@/components/cms/editors/cms-global-editor";
import {
  CmsAmenitiesEditor,
  CmsAttractionsEditor,
  CmsFaqEditor,
  CmsGalleryEditor,
  CmsHomeEditor,
  CmsRoomsEditor,
} from "@/components/cms/editors/cms-page-editors";
import { isCmsNavSlug, type CmsNavSlug } from "@/lib/cms-navigation";

type CmsSlugPageProps = {
  params: Promise<{ slug: string }>;
};

function renderEditor(slug: CmsNavSlug) {
  switch (slug) {
    case "global":
      return <CmsGlobalEditor />;
    case "home":
      return <CmsHomeEditor />;
    case "rooms":
      return <CmsRoomsEditor />;
    case "gallery":
      return <CmsGalleryEditor />;
    case "about":
      return <CmsAboutEditor />;
    case "amenities":
      return <CmsAmenitiesEditor />;
    case "attractions":
      return <CmsAttractionsEditor />;
    case "contact":
      return <CmsContactEditor />;
    case "faq":
      return <CmsFaqEditor />;
  }
}

export default function CmsSlugPage({ params }: CmsSlugPageProps) {
  const { slug } = use(params);

  if (!isCmsNavSlug(slug)) {
    notFound();
  }

  return renderEditor(slug);
}
