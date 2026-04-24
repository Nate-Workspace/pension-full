import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useOperationsData } from "@/components/providers/operations-provider";
import {
  fetchAllBookings,
  fetchPagedBookings,
  fetchRooms,
  parsePositiveInteger,
  type BookingFilter,
} from "../services/bookings-service";

export function useBookings() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { operationDay } = useOperationsData();

  const search = searchParams.get("search")?.trim() ?? "";
  const statusFilter = (searchParams.get("status") as BookingFilter | null) ?? "all";
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const pageSize = parsePositiveInteger(searchParams.get("pageSize"), 10);

  const roomsQuery = useQuery({
    queryKey: ["rooms", { scope: "all", operationDay }],
    queryFn: async () => fetchRooms(operationDay),
  });

  const fullBookingsQuery = useQuery({
    queryKey: ["bookings", { scope: "all", operationDay, search, status: statusFilter }],
    queryFn: async () => fetchAllBookings({ operationDay, search, statusFilter }),
  });

  const pagedBookingsQuery = useQuery({
    queryKey: ["bookings", { scope: "page", operationDay, search, status: statusFilter, page, pageSize }],
    queryFn: async () => fetchPagedBookings({ page, pageSize, operationDay, search, statusFilter }),
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

  const refreshData = async () => {
    await Promise.all([roomsQuery.refetch(), fullBookingsQuery.refetch(), pagedBookingsQuery.refetch()]);
  };

  const rooms = useMemo(() => roomsQuery.data ?? [], [roomsQuery.data]);
  const bookings = useMemo(() => fullBookingsQuery.data ?? [], [fullBookingsQuery.data]);
  const pageBookings = useMemo(() => pagedBookingsQuery.data?.data ?? [], [pagedBookingsQuery.data]);

  return {
    operationDay,
    search,
    statusFilter,
    page,
    pageSize,
    rooms,
    bookings,
    pageBookings,
    pageMeta: pagedBookingsQuery.data?.meta,
    isLoading: roomsQuery.isLoading || fullBookingsQuery.isLoading || pagedBookingsQuery.isLoading,
    loadError: fullBookingsQuery.error ?? roomsQuery.error ?? pagedBookingsQuery.error,
    updateUrlState,
    refreshData,
  };
}
