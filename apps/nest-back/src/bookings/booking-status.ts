export type BookingLifecycleStatus = 'active' | 'upcoming' | 'checked_out' | 'canceled';

type BookingLifecycleRecord = {
  checkInDate: string;
  checkOutDate: string;
  isCanceled: boolean;
  checkedOutAt?: Date | string | null;
};

export function computeBookingStatus(
  booking: BookingLifecycleRecord,
  operationDay: string,
): BookingLifecycleStatus {
  if (booking.isCanceled) {
    return 'canceled';
  }

  if (booking.checkedOutAt) {
    return 'checked_out';
  }

  if (operationDay < booking.checkInDate) {
    return 'upcoming';
  }

  if (operationDay >= booking.checkOutDate) {
    return 'checked_out';
  }

  return 'active';
}
