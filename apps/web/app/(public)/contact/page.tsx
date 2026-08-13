import { PublicContact } from "@/components/public/public-contact-faq";
import { loadPublicSiteData } from "@/lib/public-site-data";

export default async function ContactPage() {
  const { pension, siteContent, isOffline } = await loadPublicSiteData();

  return (
    <PublicContact
      pension={pension}
      siteContent={siteContent}
      isOffline={isOffline}
    />
  );
}
