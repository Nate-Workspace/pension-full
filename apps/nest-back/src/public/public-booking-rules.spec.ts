import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  assertMinimumAdvanceBooking,
  assertPublicBookableRoom,
  assertPublicVisibleRoom,
  getLocalOperationDay,
  isMaintenanceRoom,
  isPublicBookableRoom,
  isSameDayBookingBlocked,
  parseTimeOfDayToMinutes,
} from './public-booking-rules';

describe('public-booking-rules', () => {
  const availableRoom = { manualStatus: 'available' as const };
  const cleaningRoom = { manualStatus: 'cleaning' as const };
  const maintenanceRoom = { manualStatus: 'maintenance' as const };

  describe('isMaintenanceRoom', () => {
    it('returns true for maintenance rooms', () => {
      expect(isMaintenanceRoom(maintenanceRoom)).toBe(true);
    });

    it('returns false for non-maintenance rooms', () => {
      expect(isMaintenanceRoom(availableRoom)).toBe(false);
      expect(isMaintenanceRoom(cleaningRoom)).toBe(false);
    });
  });

  describe('assertPublicVisibleRoom', () => {
    it('allows available and cleaning rooms', () => {
      expect(() => assertPublicVisibleRoom(availableRoom)).not.toThrow();
      expect(() => assertPublicVisibleRoom(cleaningRoom)).not.toThrow();
    });

    it('throws NotFoundException for maintenance rooms', () => {
      expect(() => assertPublicVisibleRoom(maintenanceRoom)).toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when room is missing', () => {
      expect(() => assertPublicVisibleRoom(undefined)).toThrow(
        NotFoundException,
      );
    });
  });

  describe('assertPublicBookableRoom', () => {
    it('allows available and cleaning rooms', () => {
      expect(() => assertPublicBookableRoom(availableRoom)).not.toThrow();
      expect(() => assertPublicBookableRoom(cleaningRoom)).not.toThrow();
    });

    it('throws BadRequestException for maintenance rooms', () => {
      expect(() => assertPublicBookableRoom(maintenanceRoom)).toThrow(
        BadRequestException,
      );
      expect(() => assertPublicBookableRoom(maintenanceRoom)).toThrow(
        'This room is not available for online booking.',
      );
    });

    it('throws NotFoundException when room is missing', () => {
      expect(() => assertPublicBookableRoom(undefined)).toThrow(
        NotFoundException,
      );
    });
  });

  describe('isPublicBookableRoom', () => {
    it('returns true for available and cleaning rooms', () => {
      expect(isPublicBookableRoom(availableRoom)).toBe(true);
      expect(isPublicBookableRoom(cleaningRoom)).toBe(true);
    });

    it('returns false for maintenance or missing rooms', () => {
      expect(isPublicBookableRoom(maintenanceRoom)).toBe(false);
      expect(isPublicBookableRoom(undefined)).toBe(false);
    });
  });

  describe('parseTimeOfDayToMinutes', () => {
    it('parses HH:mm values', () => {
      expect(parseTimeOfDayToMinutes('18:00')).toBe(18 * 60);
      expect(parseTimeOfDayToMinutes('06:30')).toBe(6 * 60 + 30);
    });
  });

  describe('isSameDayBookingBlocked', () => {
    const config = { sameDayBookingCutoffTime: '18:00' };

    it('blocks same-day bookings after the cutoff', () => {
      const now = new Date('2026-03-24T19:30:00');

      expect(
        isSameDayBookingBlocked(getLocalOperationDay(now), config, now),
      ).toBe(true);
    });

    it('allows same-day bookings before the cutoff', () => {
      const now = new Date('2026-03-24T17:30:00');

      expect(
        isSameDayBookingBlocked(getLocalOperationDay(now), config, now),
      ).toBe(false);
    });

    it('allows future check-in dates regardless of time', () => {
      const now = new Date('2026-03-24T21:00:00');

      expect(isSameDayBookingBlocked('2026-03-25', config, now)).toBe(false);
    });
  });

  describe('assertMinimumAdvanceBooking', () => {
    const config = { sameDayBookingCutoffTime: '18:00' };

    it('allows valid future stays', () => {
      const now = new Date('2026-03-24T10:00:00');

      expect(() =>
        assertMinimumAdvanceBooking('2026-03-25', '2026-03-27', config, now),
      ).not.toThrow();
    });

    it('allows same-day bookings before the cutoff', () => {
      const now = new Date('2026-03-24T12:00:00');

      expect(() =>
        assertMinimumAdvanceBooking(
          getLocalOperationDay(now),
          '2026-03-26',
          config,
          now,
        ),
      ).not.toThrow();
    });

    it('rejects same-day bookings after the cutoff', () => {
      const now = new Date('2026-03-24T18:30:00');

      expect(() =>
        assertMinimumAdvanceBooking(
          getLocalOperationDay(now),
          '2026-03-26',
          config,
          now,
        ),
      ).toThrow(BadRequestException);
    });

    it('rejects check-in dates in the past', () => {
      const now = new Date('2026-03-24T10:00:00');

      expect(() =>
        assertMinimumAdvanceBooking('2026-03-23', '2026-03-25', config, now),
      ).toThrow('Check-in date must be today or in the future.');
    });

    it('rejects invalid stay ranges', () => {
      const now = new Date('2026-03-24T10:00:00');

      expect(() =>
        assertMinimumAdvanceBooking('2026-03-26', '2026-03-26', config, now),
      ).toThrow('Check-out must be after check-in.');
    });
  });
});
