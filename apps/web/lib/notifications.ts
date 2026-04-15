import { bookings, payments, rooms } from "@/data";

type NotificationCategory = "cleaning" | "checkout" | "payment";

export type DashboardNotification = {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: number;
};

const OPERATIONAL_DATE = "2026-03-26";

function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildDashboardNotifications(): DashboardNotification[] {
  const notifications: DashboardNotification[] = [];

  rooms
    .filter((room) => room.status === "cleaning")
    .forEach((room) => {
      notifications.push({
        id: `cleaning-${room.id}`,
        title: "Room needs cleaning",
        message: `Room ${room.number} is marked as cleaning and needs housekeeping follow-up.`,
        category: "cleaning",
        priority: 2,
      });
    });

  const checkoutWindowEnd = addDays(OPERATIONAL_DATE, 2);

  bookings
    .filter(
      (booking) =>
        booking.status === "confirmed" &&
        booking.checkOutDate >= OPERATIONAL_DATE &&
        booking.checkOutDate <= checkoutWindowEnd,
    )
    .forEach((booking) => {
      const room = rooms.find((item) => item.id === booking.roomId);

      notifications.push({
        id: `checkout-${booking.id}`,
        title: "Upcoming check-out",
        message: `${booking.code} for Room ${room?.number ?? "N/A"} checks out on ${booking.checkOutDate}.`,
        category: "checkout",
        priority: 1,
      });
    });

  const collectedByBooking = payments.reduce<Map<string, number>>((map, payment) => {
    map.set(payment.bookingId, (map.get(payment.bookingId) ?? 0) + payment.amount);
    return map;
  }, new Map<string, number>());

  payments
    .filter((payment) => payment.status === "unpaid" || payment.status === "partial")
    .forEach((payment) => {
      const booking = bookings.find((item) => item.id === payment.bookingId);
      const collected = collectedByBooking.get(payment.bookingId) ?? 0;
      const outstanding = Math.max((booking?.totalAmount ?? 0) - collected, 0);

      notifications.push({
        id: `payment-${payment.id}`,
        title: "Pending payment",
        message: `${payment.reference} has ${outstanding.toLocaleString()} Birr outstanding.`,
        category: "payment",
        priority: 0,
      });
    });

  return notifications.sort((left, right) => left.priority - right.priority);
}
