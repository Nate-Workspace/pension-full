type BookingContactRecord = {
  guestPhone: string | null;
  guestEmail: string | null;
};

export function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isEmailContact(value: string): boolean {
  return value.includes('@');
}

export function contactMatchesBooking(
  contact: string,
  booking: BookingContactRecord,
): boolean {
  const trimmed = contact.trim();

  if (!trimmed) {
    return false;
  }

  if (isEmailContact(trimmed)) {
    if (!booking.guestEmail) {
      return false;
    }

    return normalizeEmail(trimmed) === normalizeEmail(booking.guestEmail);
  }

  if (!booking.guestPhone) {
    return false;
  }

  return normalizePhone(trimmed) === normalizePhone(booking.guestPhone);
}
