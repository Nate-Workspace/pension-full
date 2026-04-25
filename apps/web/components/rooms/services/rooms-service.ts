import type { Room } from "@/data";
import { apiFetch } from "@/lib/api-client";
import type { RoomStatus } from "@/lib/types/status";

export type RoomWithGuest = Room & {
  currentGuest?: {
    name: string;
    phone?: string;
    idNumber?: string;
  };
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export function isPaginatedResponse<T>(value: unknown): value is PaginatedResponse<T> {
  return typeof value === "object" && value !== null && "data" in value && "meta" in value;
}

export function parsePositiveInteger(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  return searchParams.toString();
}

export function mapApiRoomToUiRoom(room: RoomWithGuest): RoomWithGuest {
  return {
    ...room,
    price: room.pricePerNight,
  };
}

export async function fetchRooms(params: {
  statusFilter: "all" | RoomStatus;
  search: string;
  operationDay?: string;
}): Promise<RoomWithGuest[]> {
  const query = buildQueryString({
    status: params.statusFilter !== "all" ? params.statusFilter : undefined,
    search: params.search.length > 0 ? params.search : undefined,
    operationDay: params.operationDay,
  });

  const response = await apiFetch(`/rooms${query.length > 0 ? `?${query}` : ""}`, {
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
}

export async function fetchRoomById(roomId: string, operationDay?: string): Promise<RoomWithGuest> {
  const query = buildQueryString({ operationDay });
  const response = await apiFetch(`/rooms/${roomId}${query.length > 0 ? `?${query}` : ""}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Room not found.");
    }

    throw new Error(`Failed to load room details (${response.status}).`);
  }

  const payload = (await response.json()) as RoomWithGuest;
  return mapApiRoomToUiRoom(payload);
}

export async function fetchPagedRooms(params: {
  page: number;
  pageSize: number;
  search: string;
  statusFilter: "all" | RoomStatus;
  operationDay?: string;
}): Promise<PaginatedResponse<RoomWithGuest>> {
  const query = buildQueryString({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search.length > 0 ? params.search : undefined,
    status: params.statusFilter !== "all" ? params.statusFilter : undefined,
    operationDay: params.operationDay,
  });

  const response = await apiFetch(`/rooms?${query}`, {
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
    const total = payload.length;
    const totalPages = total > 0 ? Math.ceil(total / params.pageSize) : 0;
    const startIndex = (params.page - 1) * params.pageSize;

    return {
      data: payload.slice(startIndex, startIndex + params.pageSize),
      meta: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages,
      },
    };
  }

  return isPaginatedResponse<RoomWithGuest>(payload)
    ? payload
    : {
        data: [],
        meta: {
          page: params.page,
          pageSize: params.pageSize,
          total: 0,
          totalPages: 0,
        },
      };
}

export async function updateRoomStatus(roomId: string, status: RoomStatus): Promise<void> {
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
}

export type SaveRoomInput = {
  id?: string;
  number: string;
  floor: number;
  type: Room["type"];
  status: RoomStatus;
  capacity: number;
  pricePerNight: number;
  assignedTo: string | null;
};

export async function saveRoom(input: SaveRoomInput): Promise<void> {
  if (!input.id) {
    const createResponse = await apiFetch("/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        number: input.number,
        floor: input.floor,
        type: input.type,
        status: input.status,
        capacity: input.capacity,
        pricePerNight: input.pricePerNight,
        assignedTo: input.assignedTo,
      }),
    });

    if (!createResponse.ok) {
      if (createResponse.status === 403) {
        throw new Error("You do not have permission");
      }

      throw new Error(`Failed to create room (${createResponse.status}).`);
    }

    return;
  }

  const patchResponse = await apiFetch(`/rooms/${input.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      number: input.number,
      floor: input.floor,
      type: input.type,
      capacity: input.capacity,
      pricePerNight: input.pricePerNight,
      assignedTo: input.assignedTo,
    }),
  });

  if (!patchResponse.ok) {
    if (patchResponse.status === 403) {
      throw new Error("You do not have permission");
    }

    throw new Error(`Failed to update room (${patchResponse.status}).`);
  }

  const statusResponse = await apiFetch(`/rooms/${input.id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ status: input.status }),
  });

  if (!statusResponse.ok) {
    if (statusResponse.status === 403) {
      throw new Error("You do not have permission");
    }

    throw new Error(`Failed to update room status (${statusResponse.status}).`);
  }
}
