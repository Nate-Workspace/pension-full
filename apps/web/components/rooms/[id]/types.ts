import type { Booking, BookingStatus, Room } from "@/data";

export type RoomBookingRow = {
  id: string;
  code: string;
  guestName: string;
  guestPhone?: string;
  status: BookingStatus;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalAmount: number;
  paymentStatus: Booking["paymentStatus"];
  remainingAmount: number;
};

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
