import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Room } from "@/data";
import type { RoomFormState } from "@/components/rooms/hooks/use-rooms-management";
import { saveRoomDetails } from "../services/room-details-service";

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

function validateRoomForm(formState: RoomFormState): string | null {
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

  return null;
}

type UseRoomEditFormParams = {
  roomId: string;
  room: Room | null;
  isAdmin: boolean;
};

export function useRoomEditForm({ roomId, room, isAdmin }: UseRoomEditFormParams) {
  const queryClient = useQueryClient();
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [formState, setFormState] = useState<RoomFormState>(createDefaultFormState());
  const [initialFormState, setInitialFormState] = useState<RoomFormState>(createDefaultFormState());
  const [formError, setFormError] = useState<string | null>(null);

  const saveRoomMutation = useMutation({
    mutationFn: saveRoomDetails,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["room", roomId] }),
        queryClient.invalidateQueries({ queryKey: ["room-bookings", roomId] }),
        queryClient.invalidateQueries({ queryKey: ["rooms"] }),
      ]);
      setIsEditDrawerOpen(false);
      setFormError(null);
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : "Unable to save room.");
    },
  });

  const isFormDirty = useMemo(
    () => JSON.stringify(formState) !== JSON.stringify(initialFormState),
    [formState, initialFormState],
  );

  const openEditDrawer = () => {
    if (!room || !isAdmin) {
      return;
    }

    const nextState = createFormStateFromRoom(room);
    setFormState(nextState);
    setInitialFormState(nextState);
    setFormError(null);
    setIsEditDrawerOpen(true);
  };

  const closeEditDrawer = () => {
    if (saveRoomMutation.isPending) {
      return;
    }

    setIsEditDrawerOpen(false);
  };

  const saveRoom = () => {
    const error = validateRoomForm(formState);

    if (error) {
      setFormError(error);
      return;
    }

    saveRoomMutation.mutate({
      id: formState.id,
      number: formState.number.trim(),
      floor: Number(formState.floor),
      type: formState.type,
      status: formState.status,
      capacity: Number(formState.capacity),
      pricePerNight: Number(formState.pricePerNight),
      assignedTo: formState.assignedTo.trim() ? formState.assignedTo.trim() : null,
    });
  };

  return {
    isEditDrawerOpen,
    formState,
    setFormState,
    formError,
    isFormDirty,
    isSaving: saveRoomMutation.isPending,
    openEditDrawer,
    closeEditDrawer,
    saveRoom,
  };
}
