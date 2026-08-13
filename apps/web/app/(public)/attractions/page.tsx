import { PublicAttractions } from "@/components/public/public-content-pages";
import { loadPublicSiteData } from "@/lib/public-site-data";

export default async function AttractionsPage() {
  const { siteContent, isOffline } = await loadPublicSiteData();
  return <PublicAttractions siteContent={siteContent} isOffline={isOffline} />;
}
