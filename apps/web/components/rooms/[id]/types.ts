import type { Booking, Room } from "@/data";

export type RoomBookingRow = Booking;

export type CalendarDay = {
  key: string;
  date: Date;
  iso: string;
  isCurrentMonth: boolean;
};

export type RoomAnalytics = {
  bookingCount: number;
  occupancyRate: number;
  revenueGenerated: number;
  collectedRevenue: number;
};

export type RoomDetailsData = {
  room: Room | null;
  roomBookings: Booking[];
  isLoading: boolean;
  isNotFound: boolean;
};
