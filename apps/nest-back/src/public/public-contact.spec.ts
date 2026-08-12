import { contactMatchesBooking, normalizeEmail, normalizePhone } from './public-contact';

describe('public-contact', () => {
  const booking = {
    guestPhone: '+221 77 231 8844',
    guestEmail: 'Guest@Example.com',
  };

  describe('normalizePhone', () => {
    it('strips non-digit characters', () => {
      expect(normalizePhone('+221 77 231 8844')).toBe('221772318844');
    });
  });

  describe('normalizeEmail', () => {
    it('lowercases and trims email addresses', () => {
      expect(normalizeEmail('  Guest@Example.com ')).toBe('guest@example.com');
    });
  });

  describe('contactMatchesBooking', () => {
    it('matches phone contacts with formatting differences', () => {
      expect(contactMatchesBooking('221772318844', booking)).toBe(true);
      expect(contactMatchesBooking('+221 77 231 8844', booking)).toBe(true);
    });

    it('matches email contacts case-insensitively', () => {
      expect(contactMatchesBooking('guest@example.com', booking)).toBe(true);
      expect(contactMatchesBooking('Guest@Example.com', booking)).toBe(true);
    });

    it('returns false when contact does not match', () => {
      expect(contactMatchesBooking('+221 70 000 0000', booking)).toBe(false);
      expect(contactMatchesBooking('other@example.com', booking)).toBe(false);
    });

    it('returns false when the booking is missing the requested contact type', () => {
      expect(
        contactMatchesBooking('guest@example.com', {
          guestPhone: '+221 77 231 8844',
          guestEmail: null,
        }),
      ).toBe(false);
      expect(
        contactMatchesBooking('+221 77 231 8844', {
          guestPhone: null,
          guestEmail: 'guest@example.com',
        }),
      ).toBe(false);
    });
  });
});
