import { fetchAllBookings } from "@/components/bookings/services/bookings-service";
import { toIsoDate } from "@/lib/operations";
import { fetchRoomById, saveRoom } from "@/components/rooms/services/rooms-service";

export async function fetchRoomDetails(roomId: string) {
  return fetchRoomById(roomId);
}

export async function fetchRoomBookings(roomId: string) {
  const rows = await fetchAllBookings({
    operationDay: toIsoDate(new Date()),
    search: "",
    statusFilter: "all",
  });

  return rows.filter((booking) => booking.roomId === roomId);
}

export { saveRoom as saveRoomDetails };
