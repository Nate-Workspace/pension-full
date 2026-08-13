"use client";

import { notFound } from "next/navigation";
import { use } from "react";

import { CmsContactEditor } from "@/components/cms/editors/cms-contact-editor";
import { CmsGlobalEditor } from "@/components/cms/editors/cms-global-editor";
import { CmsPlaceholderEditor } from "@/components/cms/cms-placeholder-editor";
import { isCmsNavSlug, type CmsNavSlug } from "@/lib/cms-navigation";

type CmsSlugPageProps = {
  params: Promise<{ slug: string }>;
};

function renderEditor(slug: CmsNavSlug) {
  switch (slug) {
    case "global":
      return <CmsGlobalEditor />;
    case "contact":
      return <CmsContactEditor />;
    case "home":
    case "rooms":
    case "gallery":
    case "about":
    case "amenities":
    case "attractions":
    case "faq":
      return <CmsPlaceholderEditor slug={slug} />;
  }
}

export default function CmsSlugPage({ params }: CmsSlugPageProps) {
  const { slug } = use(params);

  if (!isCmsNavSlug(slug)) {
    notFound();
  }

  return renderEditor(slug);
}
