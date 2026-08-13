import { notFound } from "next/navigation";

import { PublicRoomDetail } from "@/components/public/public-room-detail";
import { loadPublicRoomDetail } from "@/lib/public-site-data";

type PublicRoomDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PublicRoomDetailsPage({
  params,
}: PublicRoomDetailsPageProps) {
  const { id } = await params;
  const { siteData, room, initialAvailability } = await loadPublicRoomDetail(id);

  if (!room) {
    notFound();
  }

  return (
    <PublicRoomDetail
      pension={siteData.pension}
      siteContent={siteData.siteContent}
      room={room}
      initialAvailability={initialAvailability}
      isOffline={siteData.isOffline}
    />
  );
}
