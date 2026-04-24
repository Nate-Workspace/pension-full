import type { Room } from "@/data";
import { DataTable, LoadingSpinner, SelectInput, StatusBadge } from "@/components/ui";
import { ROOM_STATUS_LABELS, type RoomStatus } from "@/lib/types/status";

import { ROOM_MUTABLE_STATUSES, ROOM_STATUSES, roomTypeLabel, toCurrency } from "../hooks/use-rooms-management";
import type { RoomWithGuest } from "../services/rooms-service";

type Props = {
  search: string;
  statusFilter: "all" | RoomStatus;
  page: number;
  pageSize: number;
  pageRooms: RoomWithGuest[];
  isLoading: boolean;
  canUpdateStatus: boolean;
  isAdmin: boolean;
  isUpdatingRoomStatus: boolean;
  pendingStatusRoomId?: string;
  totalPages: number;
  updateUrlState: (nextParams: Record<string, string | number | undefined>) => void;
  onStatusChange: (roomId: string, status: RoomStatus) => void;
  onEditRoom: (room: Room) => void;
  onNavigateRoom: (roomId: string) => void;
};

export function RoomsTableSection({
  search,
  statusFilter,
  page,
  pageSize,
  pageRooms,
  isLoading,
  canUpdateStatus,
  isAdmin,
  isUpdatingRoomStatus,
  pendingStatusRoomId,
  totalPages,
  updateUrlState,
  onStatusChange,
  onEditRoom,
  onNavigateRoom,
}: Props) {
  const columns = [
    {
      key: "room",
      header: "Room",
      render: (room: Room) => (
        <div>
          <p className="font-medium text-slate-900">Room {room.number}</p>
          <p className="text-xs text-slate-500">Floor {room.floor}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (room: Room) => roomTypeLabel(room.type),
    },
    {
      key: "capacity",
      header: "Capacity",
      align: "center" as const,
      render: (room: Room) => `${room.capacity} guest${room.capacity > 1 ? "s" : ""}`,
    },
    {
      key: "price",
      header: "Price / Night",
      align: "right" as const,
      render: (room: Room) => toCurrency(room.pricePerNight),
    },
    {
      key: "status",
      header: "Status",
      render: (room: Room) => <StatusBadge status={room.status} />,
    },
    {
      key: "occupancy",
      header: "Occupancy",
      render: (room: RoomWithGuest) => {
        const activeGuest = room.currentGuest;

        if (!activeGuest) {
          if (room.status === "cleaning" && room.assignedTo) {
            return `Cleaning by ${room.assignedTo}`;
          }

          if (room.status === "cleaning") {
            return "Cleaning";
          }

          return "Not occupied";
        }

        return (
          <div>
            <p className="font-medium text-slate-900">{activeGuest.name}</p>
            {activeGuest.phone ? <p className="text-xs text-slate-500">{activeGuest.phone}</p> : null}
          </div>
        );
      },
    },
    {
      key: "quick-actions",
      header: "Quick Actions",
      render: (room: RoomWithGuest) => (
        <div className="flex flex-wrap items-center gap-2">
          {canUpdateStatus ? (
            <>
              <SelectInput
                aria-label={`Change status for room ${room.number}`}
                value={room.status}
                onChange={(event) => onStatusChange(room.id, event.target.value as RoomStatus)}
                disabled={
                  room.status === "occupied" ||
                  (isUpdatingRoomStatus && pendingStatusRoomId === room.id)
                }
                className="h-9 w-[10.5rem] text-xs"
              >
                {room.status === "occupied" ? (
                  <option value="occupied">{ROOM_STATUS_LABELS.occupied}</option>
                ) : null}

                {ROOM_MUTABLE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {ROOM_STATUS_LABELS[status]}
                  </option>
                ))}
              </SelectInput>

              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => onEditRoom(room)}
                  disabled={isUpdatingRoomStatus && pendingStatusRoomId === room.id}
                  className="h-9 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Edit
                </button>
              ) : null}
            </>
          ) : (
            <span className="text-xs text-slate-500">Not permitted</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => updateUrlState({ search: event.target.value, page: 1 })}
          placeholder="Search by room number, guest, or assignee"
          className="h-10 w-full max-w-sm rounded-md border border-slate-200 px-3 text-sm text-slate-700"
        />

        <label htmlFor="status-filter" className="text-sm font-medium text-slate-700">
          Filter by status
        </label>
        <SelectInput
          id="status-filter"
          value={statusFilter}
          onChange={(event) => updateUrlState({ status: event.target.value, page: 1 })}
          className="h-10 w-[10.5rem]"
        >
          <option value="all">All statuses</option>
          {ROOM_STATUSES.map((status) => (
            <option key={status} value={status}>
              {ROOM_STATUS_LABELS[status]}
            </option>
          ))}
        </SelectInput>
      </div>

      <DataTable<Room>
        columns={columns}
        data={pageRooms}
        getRowKey={(room) => room.id}
        enableRowNavigation
        onRowNavigate={(row) => onNavigateRoom(row.id)}
        isLoading={isLoading}
        emptyTitle="No rooms for this status"
        emptyDescription="Try selecting another status or add a new room."
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={(nextPage) => updateUrlState({ page: nextPage })}
        onPageSizeChange={(nextPageSize) => updateUrlState({ pageSize: nextPageSize, page: 1 })}
      />
    </section>
  );
}
