"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { RoomFormDrawer } from "@/components/rooms/components/room-form-drawer";

import { RoomBookingsSection } from "./[id]/components/room-bookings-section";
import { RoomCalendarCard } from "./[id]/components/room-calendar-card";
import { RoomDetailsEmptyState } from "./[id]/components/room-details-empty-state";
import { RoomDetailsHeader } from "./[id]/components/room-details-header";
import { RoomInformationCard } from "./[id]/components/room-information-card";
import { RoomMetricsSection } from "./[id]/components/room-metrics-section";
import { useRoomCalendar } from "./[id]/hooks/use-room-calendar";
import { useRoomDerivedData } from "./[id]/hooks/use-room-derived-data";
import { useRoomDetailsData } from "./[id]/hooks/use-room-details-data";
import { useRoomEditForm } from "./[id]/hooks/use-room-edit-form";

type RoomDetailsProps = {
  roomId: string;
};

export function RoomDetails({ roomId }: RoomDetailsProps) {
  const { isAdmin } = useAuth();
  const { room, roomBookings, isLoading, isNotFound } = useRoomDetailsData(roomId);
  const { bookingRows, activeBooking, analytics } = useRoomDerivedData(roomBookings);
  const { viewMonth, setViewMonth, calendarDays, reservationsByDay } = useRoomCalendar(roomBookings);
  const {
    isEditDrawerOpen,
    formState,
    setFormState,
    formError,
    isFormDirty,
    isSaving,
    openEditDrawer,
    closeEditDrawer,
    saveRoom,
  } = useRoomEditForm({ roomId, room, isAdmin });

  if (!room) {
    return <RoomDetailsEmptyState isLoading={isLoading} isNotFound={isNotFound} />;
  }

  return (
    <div className="space-y-6">
      <RoomDetailsHeader roomName={room.name} isAdmin={isAdmin} onEditRoom={openEditDrawer} />

      <RoomMetricsSection analytics={analytics} isAdmin={isAdmin} />

      <section className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
        <RoomInformationCard room={room} activeBooking={activeBooking} />
        <RoomCalendarCard
          viewMonth={viewMonth}
          setViewMonth={setViewMonth}
          calendarDays={calendarDays}
          reservationsByDay={reservationsByDay}
        />
      </section>

      <RoomBookingsSection bookingRows={bookingRows} />

      <RoomFormDrawer
        isOpen={isEditDrawerOpen}
        formState={formState}
        formError={formError}
        isDirty={isFormDirty}
        isSaving={isSaving}
        onClose={closeEditDrawer}
        onSave={saveRoom}
        onFormStateChange={setFormState}
      />
    </div>
  );
}
