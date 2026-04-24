import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useOperationsData } from "@/components/providers/operations-provider";
import type { RoomStatus } from "@/lib/types/status";
import { fetchPagedRooms, fetchRooms, parsePositiveInteger } from "../services/rooms-service";

export type RoomsStatusFilter = "all" | RoomStatus;

export function useRooms() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { operationDay } = useOperationsData();

  const statusFilter = (searchParams.get("status") as RoomsStatusFilter | null) ?? "all";
  const search = searchParams.get("search")?.trim() ?? "";
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const pageSize = parsePositiveInteger(searchParams.get("pageSize"), 10);

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
    queryFn: async () => fetchRooms({ statusFilter, search, operationDay }),
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
    queryFn: async () => fetchPagedRooms({ page, pageSize, search, statusFilter, operationDay }),
  });

  useEffect(() => {
    if (searchParams.get("page") && searchParams.get("pageSize")) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", searchParams.get("page") ?? "1");
    params.set("pageSize", searchParams.get("pageSize") ?? "10");

    const nextQuery = params.toString();
    router.replace(nextQuery.length > 0 ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

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

  const rooms = useMemo(() => roomsQuery.data ?? [], [roomsQuery.data]);
  const pageRooms = useMemo(() => pagedRoomsQuery.data?.data ?? [], [pagedRoomsQuery.data]);

  return {
    operationDay,
    statusFilter,
    search,
    page,
    pageSize,
    rooms,
    pageRooms,
    pageMeta: pagedRoomsQuery.data?.meta,
    isLoading: roomsQuery.isLoading || pagedRoomsQuery.isLoading,
    loadError: roomsQuery.error ?? pagedRoomsQuery.error,
    updateUrlState,
    refreshRooms,
  };
}
