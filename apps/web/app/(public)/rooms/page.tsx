import { PublicRoomsList } from "@/components/public/public-rooms-list";
import { loadPublicSiteData } from "@/lib/public-site-data";

export default async function PublicRoomsPage() {
  const { pension, siteContent, rooms, isOffline } = await loadPublicSiteData();

  return (
    <PublicRoomsList
      pension={pension}
      siteContent={siteContent}
      rooms={rooms}
      isOffline={isOffline}
    />
  );
}
