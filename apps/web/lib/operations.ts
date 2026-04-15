import type { Booking, Room } from "@/data";

export function toIsoDate(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

export function diffNights(checkInDate: string, checkOutDate: string): number {
  const start = parseIsoDate(checkInDate).getTime();
  const end = parseIsoDate(checkOutDate).getTime();
  const dayMs = 1000 * 60 * 60 * 24;
  return Math.round((end - start) / dayMs);
}

export function overlapsRange(
  checkInDate: string,
  checkOutDate: string,
  otherCheckInDate: string,
  otherCheckOutDate: string,
): boolean {
  return checkInDate < otherCheckOutDate && checkOutDate > otherCheckInDate;
}

export function derivePaymentStatus(totalAmount: number, paidAmount: number): Booking["paymentStatus"] {
  if (paidAmount <= 0) {
    return "unpaid";
  }

  if (paidAmount >= totalAmount) {
    return "paid";
  }

  return "partial";
}

export function isBookingActiveOn(day: string, booking: Booking): boolean {
  return booking.status !== "cancelled" && booking.checkInDate <= day && booking.checkOutDate > day;
}

export function deriveRoomsFromBookings(
  baseRooms: Room[],
  bookingList: Booking[],
  cleaningRoomIds: Set<string>,
  operationDay: string,
): Room[] {
  const activeBookingByRoomId = new Map<string, Booking>();

  bookingList.forEach((booking) => {
    if (isBookingActiveOn(operationDay, booking)) {
      activeBookingByRoomId.set(booking.roomId, booking);
    }
  });

  return baseRooms.map((room) => {
    const activeBooking = activeBookingByRoomId.get(room.id);

    if (activeBooking) {
      return {
        ...room,
        status: "occupied",
      };
    }

    if (cleaningRoomIds.has(room.id)) {
      return {
        ...room,
        status: "cleaning",
      };
    }

    return {
      ...room,
      status: room.status === "maintenance" ? "maintenance" : "available",
    };
  });
}

export function getActiveBookings(bookings: Booking[]): Booking[] {
  return bookings.filter((booking) => booking.status !== "cancelled");
}

export function getCollectedForDay(bookings: Booking[], dayIso: string): number {
  return getActiveBookings(bookings)
    .filter((booking) => booking.createdAt.slice(0, 10) === dayIso)
    .reduce((sum, booking) => sum + booking.paidAmount, 0);
}

export function getCollectedForMonth(bookings: Booking[], monthPrefix: string): number {
  return getActiveBookings(bookings)
    .filter((booking) => booking.createdAt.startsWith(monthPrefix))
    .reduce((sum, booking) => sum + booking.paidAmount, 0);
}

export function getOutstandingPayments(bookings: Booking[]): number {
  return getActiveBookings(bookings).reduce((sum, booking) => sum + booking.remainingAmount, 0);
}

export function getPaymentIssueCounts(bookings: Booking[]): { unpaid: number; partial: number } {
  const activeBookings = getActiveBookings(bookings);

  return {
    unpaid: activeBookings.filter((booking) => booking.paymentStatus === "unpaid").length,
    partial: activeBookings.filter((booking) => booking.paymentStatus === "partial").length,
  };
}
