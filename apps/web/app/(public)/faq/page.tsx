import { PublicFaq } from "@/components/public/public-contact-faq";
import { loadPublicSiteData } from "@/lib/public-site-data";

export default async function FaqPage() {
  const { siteContent, isOffline } = await loadPublicSiteData();
  return <PublicFaq siteContent={siteContent} isOffline={isOffline} />;
}
