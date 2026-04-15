export type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance";

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  available: "Available",
  occupied: "Occupied",
  cleaning: "Cleaning",
  maintenance: "Maintenance",
};
