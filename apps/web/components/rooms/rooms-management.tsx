"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import type { Room, RoomType } from "@/data";
import { useAuth } from "@/components/providers/auth-provider";
import { useOperationsData } from "@/components/providers/operations-provider";
import { DataTable, FormSurface, MetricCard, StatusBadge } from "@/components/ui";
import { apiFetch } from "@/lib/api-client";
import { ROOM_STATUS_LABELS, type RoomStatus } from "@/lib/types/status";

type StatusFilter = "all" | RoomStatus;

type RoomWithGuest = Room & {
  currentGuest?: {
    name: string;
    phone?: string;
    idNumber?: string;
  };
};

type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

function isPaginatedResponse<T>(value: unknown): value is PaginatedResponse<T> {
  return typeof value === "object" && value !== null && "data" in value && "meta" in value;
}

function parsePositiveInteger(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  return searchParams.toString();
}

type RoomFormState = {
  id?: string;
  number: string;
  floor: string;
  type: RoomType;
  status: RoomStatus;
  assignedTo: string;
  capacity: string;
  pricePerNight: string;
};

const ROOM_TYPES: RoomType[] = ["single", "double", "vip"];
const ROOM_STATUSES: RoomStatus[] = ["available", "occupied", "cleaning", "maintenance"];

function roomTypeLabel(type: RoomType): string {
  if (type === "vip") {
    return "VIP";
  }

  return `${type.slice(0, 1).toUpperCase()}${type.slice(1)}`;
}

function toCurrency(value: number): string {
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

// function sanitizeRoomForStatus(room: Room): Room {
//   return room;
// }

function mapApiRoomToUiRoom(room: RoomWithGuest): RoomWithGuest {
  return {
    ...room,
    price: room.pricePerNight,
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

export function RoomsManagement() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAdmin, user } = useAuth();
  const { operationDay } = useOperationsData();
  const statusFilter = (searchParams.get("status") as StatusFilter | null) ?? "all";
  const search = searchParams.get("search")?.trim() ?? "";
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const pageSize = parsePositiveInteger(searchParams.get("pageSize"), 10);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formState, setFormState] = useState<RoomFormState>(createDefaultFormState());
  const [formError, setFormError] = useState<string | null>(null);
  const canUpdateStatus = user?.role === "admin" || user?.role === "staff";

  const roomsQuery = useQuery({
    queryKey: [
      "rooms",
      {
        scope: "all",
        status: statusFilter,
        search,
        operationDay,
      },
    ],
    queryFn: async () => {
      const params = buildQueryString({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search.length > 0 ? search : undefined,
        operationDay,
      });

      const response = await apiFetch(`/rooms${params.length > 0 ? `?${params}` : ""}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to load rooms (${response.status}).`);
      }

      const payload = (await response.json()) as PaginatedResponse<RoomWithGuest> | RoomWithGuest[];
      const rows = Array.isArray(payload)
        ? payload
        : isPaginatedResponse<RoomWithGuest>(payload)
          ? payload.data
          : [];

      return rows.map(mapApiRoomToUiRoom);
    },
  });

  const pagedRoomsQuery = useQuery({
    queryKey: [
      "rooms",
      {
        scope: "page",
        page,
        pageSize,
        search,
        filters: {
          status: statusFilter,
          operationDay,
        },
      },
    ],
    queryFn: async () => {
      const params = buildQueryString({
        page,
        pageSize,
        search: search.length > 0 ? search : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        operationDay,
      });

      const endpoint = `/rooms?${params}`;

      const response = await apiFetch(endpoint, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to load rooms (${response.status}).`);
      }

      const payload = (await response.json()) as PaginatedResponse<RoomWithGuest> | RoomWithGuest[];

      if (Array.isArray(payload)) {
        return {
          data: payload,
          meta: {
            page,
            pageSize,
            total: payload.length,
            totalPages: payload.length > 0 ? 1 : 0,
          },
        };
      }

      return isPaginatedResponse<RoomWithGuest>(payload)
        ? payload
        : {
            data: [],
            meta: {
              page,
              pageSize,
              total: 0,
              totalPages: 0,
            },
          };
    },
  });

  const rooms = useMemo(() => roomsQuery.data ?? [], [roomsQuery.data]);
  const pageRooms = useMemo(
    () => (pagedRoomsQuery.data?.data ?? []).map(mapApiRoomToUiRoom),
    [pagedRoomsQuery.data],
  );
  const pageMeta = pagedRoomsQuery.data?.meta;
  const isLoading = roomsQuery.isLoading || pagedRoomsQuery.isLoading;

  const updateUrlState = (nextParams: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(nextParams).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        params.delete(key);
        return;
      }

      params.set(key, String(value));
    });

    const nextQuery = params.toString();
    router.replace(nextQuery.length > 0 ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  const refreshRooms = async () => {
    await Promise.all([roomsQuery.refetch(), pagedRoomsQuery.refetch()]);
  };

  const filteredRooms = pageRooms;

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
        const response = await apiFetch(`/rooms/${roomId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("You do not have permission");
          }

          throw new Error(`Failed to update room status (${response.status}).`);
        }

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
        if (!formState.id) {
          const createResponse = await apiFetch("/rooms", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              number: formState.number.trim(),
              floor,
              type: formState.type,
              status: formState.status,
              capacity,
              pricePerNight,
              assignedTo,
            }),
          });

          if (!createResponse.ok) {
            if (createResponse.status === 403) {
              throw new Error("You do not have permission");
            }

            throw new Error(`Failed to create room (${createResponse.status}).`);
          }

          await refreshRooms();
        } else {
          const patchResponse = await apiFetch(`/rooms/${formState.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              number: formState.number.trim(),
              floor,
              type: formState.type,
              capacity,
              pricePerNight,
              assignedTo,
            }),
          });

          if (!patchResponse.ok) {
            if (patchResponse.status === 403) {
              throw new Error("You do not have permission");
            }

            throw new Error(`Failed to update room (${patchResponse.status}).`);
          }

          if (!patchResponse.ok) {
            if (patchResponse.status === 403) {
              throw new Error("You do not have permission");
            }

            throw new Error(`Failed to update room (${patchResponse.status}).`);
          }

          if (formState.status) {
            const statusResponse = await apiFetch(`/rooms/${formState.id}/status`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({ status: formState.status }),
            });

            if (!statusResponse.ok) {
              if (statusResponse.status === 403) {
                throw new Error("You do not have permission");
              }

              throw new Error(`Failed to update room status (${statusResponse.status}).`);
            }
          }

          await refreshRooms();
        }

        setIsDrawerOpen(false);
        setFormError(null);
      } catch (error) {
        console.error(error);
        setFormError(error instanceof Error ? error.message : "Unable to save room.");
      }
    })();
  };

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
              <select
                aria-label={`Change status for room ${room.number}`}
                value={room.status}
                onChange={(event) => handleStatusChange(room.id, event.target.value as RoomStatus)}
                className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"
              >
                {ROOM_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {ROOM_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>

              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => openEditDrawer(room)}
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
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(event) => updateUrlState({ status: event.target.value, page: 1 })}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
          >
            <option value="all">All statuses</option>
            {ROOM_STATUSES.map((status) => (
              <option key={status} value={status}>
                {ROOM_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <DataTable<Room>
          columns={columns}
          data={filteredRooms}
          getRowKey={(room) => room.id}
          enableRowNavigation
          onRowNavigate={(row) => router.push(`/rooms/${row.id}`)}
          isLoading={isLoading}
          emptyTitle="No rooms for this status"
          emptyDescription="Try selecting another status or add a new room."
          page={page}
          pageSize={pageSize}
          totalPages={pageMeta?.totalPages ?? 0}
          onPageChange={(nextPage) => updateUrlState({ page: nextPage })}
          onPageSizeChange={(nextPageSize) => updateUrlState({ pageSize: nextPageSize, page: 1 })}
        />
      </section>

      <FormSurface
        open={isDrawerOpen}
        onClose={closeDrawer}
        mode="drawer"
        title={formState.id ? `Edit Room ${formState.number}` : "Add New Room"}
        description="Update room details and operational status."
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeDrawer}
              className="h-10 rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveRoom}
              className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              {formState.id ? "Save Changes" : "Create Room"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Room Number</span>
              <input
                type="text"
                value={formState.number}
                onChange={(event) => setFormState((prev) => ({ ...prev, number: event.target.value }))}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
                placeholder="e.g. 401"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Floor</span>
              <input
                type="number"
                min={1}
                value={formState.floor}
                onChange={(event) => setFormState((prev) => ({ ...prev, floor: event.target.value }))}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Room Type</span>
              <select
                value={formState.type}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, type: event.target.value as RoomType }))
                }
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800"
              >
                {ROOM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {roomTypeLabel(type)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select
                value={formState.status}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, status: event.target.value as RoomStatus }))
                }
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800"
              >
                {ROOM_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {ROOM_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Capacity</span>
              <input
                type="number"
                min={1}
                value={formState.capacity}
                onChange={(event) => setFormState((prev) => ({ ...prev, capacity: event.target.value }))}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Price / Night (Birr)</span>
              <input
                type="number"
                min={1000}
                step={500}
                value={formState.pricePerNight}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, pricePerNight: event.target.value }))
                }
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              />
            </label>
          </div>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Assigned to (optional)</span>
            <input
              type="text"
              value={formState.assignedTo}
              onChange={(event) => setFormState((prev) => ({ ...prev, assignedTo: event.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              placeholder="e.g. Housekeeping A"
            />
          </label>

          {formError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </p>
          ) : null}
        </div>
      </FormSurface>
    </div>
  );
}
