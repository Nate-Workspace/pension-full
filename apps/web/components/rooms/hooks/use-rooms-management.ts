import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { Room, RoomType } from "@/data";
import { useAuth } from "@/components/providers/auth-provider";
import type { RoomStatus } from "@/lib/types/status";
import {
  saveRoom,
  updateRoomStatus,
  type RoomWithGuest,
} from "../services/rooms-service";
import { useRooms, type RoomsStatusFilter } from "./use-rooms";

export type StatusFilter = RoomsStatusFilter;

export type RoomFormState = {
  id?: string;
  number: string;
  floor: string;
  type: RoomType;
  status: RoomStatus;
  assignedTo: string;
  capacity: string;
  pricePerNight: string;
};

export const ROOM_TYPES: RoomType[] = ["single", "double", "vip"];
export const ROOM_STATUSES: RoomStatus[] = ["available", "occupied", "cleaning", "maintenance"];

export function roomTypeLabel(type: RoomType): string {
  if (type === "vip") {
    return "VIP";
  }

  return `${type.slice(0, 1).toUpperCase()}${type.slice(1)}`;
}

export function toCurrency(value: number): string {
  return `${value.toLocaleString("en-US")} Birr`;
}

function createDefaultFormState(): RoomFormState {
  return {
    number: "",
    floor: "1",
    type: "single",
    status: "available",
    assignedTo: "",
    capacity: "1",
    pricePerNight: "25000",
  };
}

function createFormStateFromRoom(room: Room): RoomFormState {
  return {
    id: room.id,
    number: room.number,
    floor: String(room.floor),
    type: room.type,
    status: room.status,
    assignedTo: room.assignedTo ?? "",
    capacity: String(room.capacity),
    pricePerNight: String(room.pricePerNight),
  };
}

function validateRoomForm(formState: RoomFormState, existingRooms: Room[]): string | null {
  if (formState.number.trim().length < 2) {
    return "Room number must be at least 2 characters.";
  }

  const floor = Number(formState.floor);
  const capacity = Number(formState.capacity);
  const pricePerNight = Number(formState.pricePerNight);

  if (!Number.isInteger(floor) || floor <= 0) {
    return "Floor must be a valid positive number.";
  }

  if (!Number.isInteger(capacity) || capacity <= 0) {
    return "Capacity must be a valid positive number.";
  }

  if (!Number.isFinite(pricePerNight) || pricePerNight <= 0) {
    return "Price per night must be a valid positive amount.";
  }

  const duplicate = existingRooms.find(
    (room) => room.number.trim().toLowerCase() === formState.number.trim().toLowerCase() && room.id !== formState.id,
  );

  if (duplicate) {
    return `Room ${formState.number.trim()} already exists.`;
  }

  return null;
}

export function useRoomsManagement() {
  const router = useRouter();
  const {
    statusFilter,
    search,
    page,
    pageSize,
    rooms,
    pageRooms,
    pageMeta,
    isLoading,
    updateUrlState,
    refreshRooms,
  } = useRooms();
  const { isAdmin, user } = useAuth();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formState, setFormState] = useState<RoomFormState>(createDefaultFormState());
  const [formError, setFormError] = useState<string | null>(null);
  const canUpdateStatus = user?.role === "admin" || user?.role === "staff";

  const metrics = useMemo(() => {
    const occupiedCount = rooms.filter((room) => room.status === "occupied").length;
    const availableCount = rooms.filter((room) => room.status === "available").length;
    const cleaningCount = rooms.filter((room) => room.status === "cleaning").length;

    return {
      total: rooms.length,
      occupied: occupiedCount,
      available: availableCount,
      cleaning: cleaningCount,
    };
  }, [rooms]);

  const openAddDrawer = () => {
    setFormError(null);
    setFormState(createDefaultFormState());
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (room: Room) => {
    setFormError(null);
    setFormState(createFormStateFromRoom(room));
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setFormError(null);
  };

  const handleStatusChange = (roomId: string, status: RoomStatus) => {
    void (async () => {
      try {
        await updateRoomStatus(roomId, status);
        await refreshRooms();
      } catch (error) {
        console.error(error);
      }
    })();
  };

  const handleSaveRoom = () => {
    const error = validateRoomForm(formState, rooms);

    if (error) {
      setFormError(error);
      return;
    }

    const floor = Number(formState.floor);
    const capacity = Number(formState.capacity);
    const pricePerNight = Number(formState.pricePerNight);
    const assignedTo = formState.assignedTo.trim().length > 0 ? formState.assignedTo.trim() : null;

    void (async () => {
      try {
        await saveRoom({
          id: formState.id,
          number: formState.number.trim(),
          floor,
          type: formState.type,
          status: formState.status,
          capacity,
          pricePerNight,
          assignedTo,
        });

        await refreshRooms();
        setIsDrawerOpen(false);
        setFormError(null);
      } catch (saveError) {
        console.error(saveError);
        setFormError(saveError instanceof Error ? saveError.message : "Unable to save room.");
      }
    })();
  };

  return {
    isAdmin,
    canUpdateStatus,
    search,
    statusFilter,
    page,
    pageSize,
    rooms,
    pageRooms,
    pageMeta,
    isLoading,
    metrics,
    isDrawerOpen,
    formState,
    setFormState,
    formError,
    updateUrlState,
    openAddDrawer,
    openEditDrawer,
    closeDrawer,
    handleStatusChange,
    handleSaveRoom,
    navigateToRoom: (roomId: string) => router.push(`/rooms/${roomId}`),
  } satisfies {
    isAdmin: boolean;
    canUpdateStatus: boolean;
    search: string;
    statusFilter: StatusFilter;
    page: number;
    pageSize: number;
    rooms: RoomWithGuest[];
    pageRooms: RoomWithGuest[];
    pageMeta:
      | {
          page: number;
          pageSize: number;
          total: number;
          totalPages: number;
        }
      | undefined;
    isLoading: boolean;
    metrics: {
      total: number;
      occupied: number;
      available: number;
      cleaning: number;
    };
    isDrawerOpen: boolean;
    formState: RoomFormState;
    setFormState: Dispatch<SetStateAction<RoomFormState>>;
    formError: string | null;
    updateUrlState: (nextParams: Record<string, string | number | undefined>) => void;
    openAddDrawer: () => void;
    openEditDrawer: (room: Room) => void;
    closeDrawer: () => void;
    handleStatusChange: (roomId: string, status: RoomStatus) => void;
    handleSaveRoom: () => void;
    navigateToRoom: (roomId: string) => void;
  };
}
