import { PublicHome } from "@/components/public/public-home";
import { loadPublicHomeData } from "@/lib/public-home-data";

export default async function PublicHomePage() {
  const { pension, siteContent, rooms, isOffline } = await loadPublicHomeData();

  return (
    <PublicHome
      pension={pension}
      siteContent={siteContent}
      rooms={rooms}
      isOffline={isOffline}
    />
  );
}
