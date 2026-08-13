import { PublicAmenities } from "@/components/public/public-content-pages";
import { loadPublicSiteData } from "@/lib/public-site-data";

export default async function AmenitiesPage() {
  const { siteContent, isOffline } = await loadPublicSiteData();
  return <PublicAmenities siteContent={siteContent} isOffline={isOffline} />;
}
