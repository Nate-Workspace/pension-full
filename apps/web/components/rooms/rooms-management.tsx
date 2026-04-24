"use client";

import { MetricCard } from "@/components/ui";

import { RoomFormDrawer } from "./components/room-form-drawer";
import { RoomsTableSection } from "./components/rooms-table-section";
import { useRoomsManagement } from "./hooks/use-rooms-management";

export function RoomsManagement() {
  const {
    isAdmin,
    canUpdateStatus,
    search,
    statusFilter,
    page,
    pageSize,
    pageRooms,
    pageMeta,
    isLoading,
    metrics,
    isDrawerOpen,
    formState,
    setFormState,
    formError,
    isFormDirty,
    isSavingRoom,
    isUpdatingRoomStatus,
    pendingStatusRoomId,
    updateUrlState,
    openAddDrawer,
    openEditDrawer,
    closeDrawer,
    handleStatusChange,
    handleSaveRoom,
    navigateToRoom,
  } = useRoomsManagement();

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Room Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage room inventory and update room operational statuses.
          </p>
        </div>

        {isAdmin ? (
          <button
            type="button"
            onClick={openAddDrawer}
            className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            Add Room
          </button>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Rooms" value={String(metrics.total)} />
        <MetricCard title="Occupied" value={String(metrics.occupied)} />
        <MetricCard title="Available" value={String(metrics.available)} />
        <MetricCard title="Cleaning" value={String(metrics.cleaning)} />
      </section>

      <RoomsTableSection
        search={search}
        statusFilter={statusFilter}
        page={page}
        pageSize={pageSize}
        pageRooms={pageRooms}
        isLoading={isLoading}
        canUpdateStatus={canUpdateStatus}
        isAdmin={isAdmin}
        isUpdatingRoomStatus={isUpdatingRoomStatus}
        pendingStatusRoomId={pendingStatusRoomId}
        totalPages={pageMeta?.totalPages ?? 0}
        updateUrlState={updateUrlState}
        onStatusChange={handleStatusChange}
        onEditRoom={openEditDrawer}
        onNavigateRoom={navigateToRoom}
      />

      <RoomFormDrawer
        isOpen={isDrawerOpen}
        formState={formState}
        formError={formError}
        isDirty={isFormDirty}
        isSaving={isSavingRoom}
        onClose={closeDrawer}
        onSave={handleSaveRoom}
        onFormStateChange={setFormState}
      />
    </div>
  );
}
