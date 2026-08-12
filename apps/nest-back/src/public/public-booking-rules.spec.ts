import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  assertPublicBookableRoom,
  assertPublicVisibleRoom,
  isMaintenanceRoom,
  isPublicBookableRoom,
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
});
