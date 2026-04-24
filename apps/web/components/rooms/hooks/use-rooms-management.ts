import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

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
export const ROOM_MUTABLE_STATUSES: RoomStatus[] = ["available", "cleaning", "maintenance"];

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
  const [initialFormState, setInitialFormState] = useState<RoomFormState>(createDefaultFormState());
  const [formError, setFormError] = useState<string | null>(null);
  const canUpdateStatus = user?.role === "admin" || user?.role === "staff";

  const updateRoomStatusMutation = useMutation({
    mutationFn: ({ roomId, status }: { roomId: string; status: RoomStatus }) => updateRoomStatus(roomId, status),
    onSuccess: async () => {
      await refreshRooms();
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const saveRoomMutation = useMutation({
    mutationFn: saveRoom,
    onSuccess: async () => {
      await refreshRooms();
      setIsDrawerOpen(false);
      setFormError(null);
    },
    onError: (saveError) => {
      console.error(saveError);
      setFormError(saveError instanceof Error ? saveError.message : "Unable to save room.");
    },
  });

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
    const defaults = createDefaultFormState();
    setFormError(null);
    setFormState(defaults);
    setInitialFormState(defaults);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (room: Room) => {
    const nextState = createFormStateFromRoom(room);
    setFormError(null);
    setFormState(nextState);
    setInitialFormState(nextState);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setFormError(null);
  };

  const isFormDirty = useMemo(
    () => JSON.stringify(formState) !== JSON.stringify(initialFormState),
    [formState, initialFormState],
  );

  const handleStatusChange = (roomId: string, status: RoomStatus) => {
    updateRoomStatusMutation.mutate({ roomId, status });
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

    saveRoomMutation.mutate({
      id: formState.id,
      number: formState.number.trim(),
      floor,
      type: formState.type,
      status: formState.status,
      capacity,
      pricePerNight,
      assignedTo,
    });
  };

  const pendingStatusRoomId = updateRoomStatusMutation.variables?.roomId;

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
    isFormDirty,
    isSavingRoom: saveRoomMutation.isPending,
    isUpdatingRoomStatus: updateRoomStatusMutation.isPending,
    pendingStatusRoomId,
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
    isFormDirty: boolean;
    isSavingRoom: boolean;
    isUpdatingRoomStatus: boolean;
    pendingStatusRoomId: string | undefined;
    updateUrlState: (nextParams: Record<string, string | number | undefined>) => void;
    openAddDrawer: () => void;
    openEditDrawer: (room: Room) => void;
    closeDrawer: () => void;
    handleStatusChange: (roomId: string, status: RoomStatus) => void;
    handleSaveRoom: () => void;
    navigateToRoom: (roomId: string) => void;
  };
}
