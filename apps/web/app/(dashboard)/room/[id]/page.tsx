import { notFound } from "next/navigation";

import { RoomDetails } from "@/components/rooms/room-details";
import { rooms } from "@/data";

type RoomDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RoomDetailsPage({ params }: RoomDetailsPageProps) {
  const { id } = await params;
  const roomExists = rooms.some((room) => room.id === id);

  if (!roomExists) {
    notFound();
  }

  return <RoomDetails roomId={id} />;
}
