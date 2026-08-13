import { RoomDetails } from "@/components/rooms/room-details";

type RoomDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RoomDetailsPage({ params }: RoomDetailsPageProps) {
  const { id } = await params;
  return <RoomDetails roomId={id} />;
}
