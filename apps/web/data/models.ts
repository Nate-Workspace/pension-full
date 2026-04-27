export type RoomType = "single" | "double" | "vip";
export type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance";

export type Room = {
  id: string;
  name: string;
  number: string;
  floor: number;
  type: RoomType;
  status: RoomStatus;
  price: number;
  pricePerNight: number;
  capacity: number;
  assignedTo?: string;
};

export type BookingGuestInfo = {
  name: string;
  phone?: string;
  idNumber?: string;
};

export type BookingPaymentStatus = "paid" | "partial" | "unpaid";

export type BookingStatus =
  | "active"
  | "upcoming"
  | "checked_out"
  | "canceled"
  | "confirmed"
  | "pending"
  | "cancelled";

export type Booking = {
  id: string;
  code: string;
  guest: BookingGuestInfo;
  handledBy?: string;
  roomId: Room["id"];
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: BookingPaymentStatus;
  dueDate?: string;
  createdAt: string;
  source: "walk-in" | "phone" | "website" | "agent";
};

export type PaymentMethod = "cash" | "mobile_money";
export type PaymentStatus = "paid" | "partial" | "unpaid";

export type Payment = {
  id: string;
  bookingId: Booking["id"];
  roomId: Room["id"];
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt?: string;
  reference: string;
};
