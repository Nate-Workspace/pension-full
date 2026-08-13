import { PublicLegalPage } from "@/components/public/public-legal-page";
import { loadPublicSiteData } from "@/lib/public-site-data";

export default async function PrivacyPage() {
  const { siteContent, isOffline } = await loadPublicSiteData();

  return (
    <PublicLegalPage siteContent={siteContent} isOffline={isOffline} kind="privacy" />
  );
}
