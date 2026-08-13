import { PublicAbout } from "@/components/public/public-content-pages";
import { loadPublicSiteData } from "@/lib/public-site-data";

export default async function AboutPage() {
  const { siteContent, isOffline } = await loadPublicSiteData();
  return <PublicAbout siteContent={siteContent} isOffline={isOffline} />;
}
