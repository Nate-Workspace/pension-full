import type {
  PublicPensionResponse,
  PublicRoomAvailabilityResponse,
  PublicRoomResponse,
  SiteContentResponse,
} from "@repo/contracts";

import { PublicRoomDetailView } from "./public-room-detail-view";

type PublicRoomDetailProps = {
  pension: PublicPensionResponse;
  siteContent: SiteContentResponse;
  room: PublicRoomResponse;
  initialAvailability: PublicRoomAvailabilityResponse | null;
  isOffline?: boolean;
};

export function PublicRoomDetail({
  pension,
  siteContent,
  room,
  initialAvailability,
  isOffline = false,
}: PublicRoomDetailProps) {
  return (
    <PublicRoomDetailView
      pension={pension}
      siteContent={siteContent}
      room={room}
      initialAvailability={initialAvailability}
      isOffline={isOffline}
    />
  );
}
