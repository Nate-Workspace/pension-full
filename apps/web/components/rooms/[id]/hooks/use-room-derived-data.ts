import { useMemo } from "react";
import type { Booking } from "@/data";
import type { RoomAnalytics, RoomBookingRow } from "../types";
import { computeOccupancyRate } from "../utils";

export function useRoomDerivedData(roomBookings: Booking[]) {
  const bookingRows = useMemo<RoomBookingRow[]>(() => {
    return roomBookings.map((booking) => {
      return {
        id: booking.id,
        code: booking.code,
        guestName: booking.guest.name,
        guestPhone: booking.guest.phone,
        status: booking.status,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        nights: booking.nights,
        totalAmount: booking.totalAmount,
        paymentStatus: booking.paymentStatus,
        remainingAmount: booking.remainingAmount,
      };
    });
  }, [roomBookings]);

  const activeBooking = useMemo(() => {
    return roomBookings.find((booking) => booking.status === "active") ?? null;
  }, [roomBookings]);

  const analytics = useMemo<RoomAnalytics>(() => {
    const nonCancelled = roomBookings.filter((booking) => booking.status !== "canceled" && booking.status !== "cancelled");

    return {
      bookingCount: roomBookings.length,
      occupancyRate: computeOccupancyRate(roomBookings),
      revenueGenerated: nonCancelled.reduce((sum, booking) => sum + booking.totalAmount, 0),
      collectedRevenue: roomBookings.reduce((sum, booking) => sum + booking.paidAmount, 0),
    };
  }, [roomBookings]);

  return {
    bookingRows,
    activeBooking,
    analytics,
  };
}
