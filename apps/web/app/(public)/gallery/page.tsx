import { PublicGallery } from "@/components/public/public-content-pages";
import { loadPublicSiteData } from "@/lib/public-site-data";

export default async function GalleryPage() {
  const { siteContent, isOffline } = await loadPublicSiteData();
  return <PublicGallery siteContent={siteContent} isOffline={isOffline} />;
}
