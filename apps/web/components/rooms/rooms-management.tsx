"use client";

import { useCallback, useMemo, useState } from "react";
import { useEffect } from "react";

import type { Room, RoomType } from "@/data";
import { useOperationsData } from "@/components/providers/operations-provider";
import { DataTable, FormSurface, MetricCard, StatusBadge } from "@/components/ui";
import { ROOM_STATUS_LABELS, type RoomStatus } from "@/lib/types/status";

type StatusFilter = "all" | RoomStatus;

type RoomWithGuest = Room & {
  currentGuest?: {
    name: string;
    phone?: string;
    idNumber?: string;
  };
};

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

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");

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

function sanitizeRoomForStatus(room: Room): Room {
  return room;
}

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
  const { operationDay } = useOperationsData();
  const [isLoading, setIsLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomWithGuest[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formState, setFormState] = useState<RoomFormState>(createDefaultFormState());
  const [formError, setFormError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    const params = new URLSearchParams();

    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }

    if (operationDay) {
      params.set("operationDay", operationDay);
    }

    const query = params.toString();
    const endpoint = `${API_BASE_URL}/rooms${query.length > 0 ? `?${query}` : ""}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to load rooms (${response.status}).`);
    }

    const payload = (await response.json()) as RoomWithGuest[];
    setRooms(payload.map(mapApiRoomToUiRoom));
  }, [operationDay, statusFilter]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);

      try {
        await fetchRooms();
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [fetchRooms]);

  const filteredRooms = useMemo(() => rooms, [rooms]);

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
    const previousRooms = rooms;

    setRooms((currentRooms) =>
      currentRooms.map((room) => {
        if (room.id !== roomId) {
          return room;
        }

        return {
          ...room,
          status,
        };
      }),
    );

    void (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update room status (${response.status}).`);
        }

        const updatedRoom = mapApiRoomToUiRoom((await response.json()) as RoomWithGuest);

        setRooms((currentRooms) =>
          currentRooms.map((room) => (room.id === roomId ? updatedRoom : room)),
        );
      } catch (error) {
        console.error(error);
        setRooms(previousRooms);
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
          const createResponse = await fetch(`${API_BASE_URL}/rooms`, {
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
            throw new Error(`Failed to create room (${createResponse.status}).`);
          }

          const createdRoom = mapApiRoomToUiRoom((await createResponse.json()) as RoomWithGuest);
          setRooms((currentRooms) => [...currentRooms, createdRoom]);
        } else {
          const existingRoom = rooms.find((room) => room.id === formState.id);
          const patchResponse = await fetch(`${API_BASE_URL}/rooms/${formState.id}`, {
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
            throw new Error(`Failed to update room (${patchResponse.status}).`);
          }

          let updatedRoom = mapApiRoomToUiRoom((await patchResponse.json()) as RoomWithGuest);

          if (existingRoom && existingRoom.status !== formState.status) {
            const statusResponse = await fetch(`${API_BASE_URL}/rooms/${formState.id}/status`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({ status: formState.status }),
            });

            if (!statusResponse.ok) {
              throw new Error(`Failed to update room status (${statusResponse.status}).`);
            }

            updatedRoom = mapApiRoomToUiRoom((await statusResponse.json()) as RoomWithGuest);
          }

          setRooms((currentRooms) =>
            currentRooms.map((room) => (room.id === formState.id ? updatedRoom : room)),
          );
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

          <button
            type="button"
            onClick={() => openEditDrawer(room)}
            className="h-9 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Edit
          </button>
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

        <button
          type="button"
          onClick={openAddDrawer}
          className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add Room
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Rooms" value={String(metrics.total)} />
        <MetricCard title="Occupied" value={String(metrics.occupied)} />
        <MetricCard title="Available" value={String(metrics.available)} />
        <MetricCard title="Cleaning" value={String(metrics.cleaning)} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label htmlFor="status-filter" className="text-sm font-medium text-slate-700">
            Filter by status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
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
          isLoading={isLoading}
          emptyTitle="No rooms for this status"
          emptyDescription="Try selecting another status or add a new room."
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
