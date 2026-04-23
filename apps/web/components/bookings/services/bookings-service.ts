import type { Booking, BookingStatus, Room } from "@/data";
import { apiFetch } from "@/lib/api-client";

export type BookingFilter = "all" | BookingStatus;

export type ApiErrorPayload = {
  message?: string | string[];
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

export function mapApiRoomToUiRoom(room: Room): Room {
  return {
    ...room,
    price: room.pricePerNight,
  };
}

export async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

  if (!payload?.message) {
    return fallback;
  }

  if (Array.isArray(payload.message)) {
    return payload.message[0] ?? fallback;
  }

  return payload.message;
}

export async function fetchRooms(operationDay?: string): Promise<Room[]> {
  const params = buildQueryString({ operationDay });
  const response = await apiFetch(`/rooms${params.length > 0 ? `?${params}` : ""}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Failed to load rooms (${response.status}).`));
  }

  const payload = (await response.json()) as PaginatedResponse<Room> | Room[];
  const rows = Array.isArray(payload) ? payload : isPaginatedResponse<Room>(payload) ? payload.data : [];
  return rows.map(mapApiRoomToUiRoom);
}

export async function fetchAllBookings(params: {
  operationDay: string;
  search: string;
  statusFilter: BookingFilter;
}): Promise<Booking[]> {
  const query = buildQueryString({
    operationDay: params.operationDay,
    search: params.search.length > 0 ? params.search : undefined,
    status: params.statusFilter !== "all" ? params.statusFilter : undefined,
  });

  const response = await apiFetch(`/bookings${query.length > 0 ? `?${query}` : ""}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Failed to load bookings (${response.status}).`));
  }

  const payload = (await response.json()) as PaginatedResponse<Booking> | Booking[];
  return Array.isArray(payload) ? payload : isPaginatedResponse<Booking>(payload) ? payload.data : [];
}

export async function fetchPagedBookings(params: {
  page: number;
  pageSize: number;
  operationDay: string;
  search: string;
  statusFilter: BookingFilter;
}): Promise<PaginatedResponse<Booking>> {
  const query = buildQueryString({
    page: params.page,
    pageSize: params.pageSize,
    operationDay: params.operationDay,
    search: params.search.length > 0 ? params.search : undefined,
    status: params.statusFilter !== "all" ? params.statusFilter : undefined,
  });

  const response = await apiFetch(`/bookings?${query}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Failed to load bookings (${response.status}).`));
  }

  const payload = (await response.json()) as PaginatedResponse<Booking> | Booking[];

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

  return isPaginatedResponse<Booking>(payload)
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

export async function saveBooking(input: {
  id?: string;
  guestName: string;
  guestPhone?: string;
  guestIdNumber?: string;
  handledBy?: string;
  roomId: string;
  status: BookingStatus;
  checkInDate: string;
  checkOutDate: string;
  paidAmount: number;
  source: Booking["source"];
}): Promise<void> {
  const endpoint = input.id ? `/bookings/${input.id}` : "/bookings";
  const method = input.id ? "PATCH" : "POST";

  const response = await apiFetch(endpoint, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      guestName: input.guestName,
      guestPhone: input.guestPhone,
      guestIdNumber: input.guestIdNumber,
      handledBy: input.handledBy,
      roomId: input.roomId,
      status: input.status,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      paidAmount: input.paidAmount,
      source: input.source,
    }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Failed to save booking (${response.status}).`));
  }
}

export async function checkoutBooking(bookingId: string): Promise<void> {
  const response = await apiFetch(`/bookings/${bookingId}/checkout`, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Failed to check out booking (${response.status}).`));
  }
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const response = await apiFetch(`/bookings/${bookingId}/cancel`, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Failed to cancel booking (${response.status}).`));
  }
}

export async function setRoomAvailable(roomId: string): Promise<void> {
  const response = await apiFetch(`/rooms/${roomId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ status: "available" }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Failed to set room available (${response.status}).`));
  }
}
