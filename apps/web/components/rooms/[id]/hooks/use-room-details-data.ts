import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRoomBookings, fetchRoomDetails } from "../services/room-details-service";

export function useRoomDetailsData(roomId: string) {
  const roomQuery = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => fetchRoomDetails(roomId),
  });

  const roomBookingsQuery = useQuery({
    queryKey: ["room-bookings", roomId],
    queryFn: () => fetchRoomBookings(roomId),
  });

  const room = roomQuery.data ?? null;
  const roomBookings = useMemo(() => {
    return [...(roomBookingsQuery.data ?? [])].sort((left, right) => right.checkInDate.localeCompare(left.checkInDate));
  }, [roomBookingsQuery.data]);

  const isLoading = roomQuery.isLoading || roomBookingsQuery.isLoading;
  const isNotFound = roomQuery.error instanceof Error && roomQuery.error.message === "Room not found.";

  return {
    roomQuery,
    roomBookingsQuery,
    room,
    roomBookings,
    isLoading,
    isNotFound,
  };
}
