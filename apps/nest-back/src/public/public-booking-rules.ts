import { BadRequestException, NotFoundException } from '@nestjs/common';

type PublicRoomRecord = {
  manualStatus: 'available' | 'cleaning' | 'maintenance';
};

export type PublicAdvanceBookingConfig = {
  sameDayBookingCutoffTime: string;
};

export function isMaintenanceRoom(room: PublicRoomRecord): boolean {
  return room.manualStatus === 'maintenance';
}

export function assertPublicVisibleRoom(
  room: PublicRoomRecord | undefined,
): asserts room is PublicRoomRecord {
  if (!room || isMaintenanceRoom(room)) {
    throw new NotFoundException('Room not found');
  }
}

export function assertPublicBookableRoom(
  room: PublicRoomRecord | undefined,
): asserts room is PublicRoomRecord {
  if (!room) {
    throw new NotFoundException('Room not found');
  }

  if (isMaintenanceRoom(room)) {
    throw new BadRequestException(
      'This room is not available for online booking.',
    );
  }
}

export function isPublicBookableRoom(
  room: PublicRoomRecord | undefined,
): room is PublicRoomRecord {
  return Boolean(room && !isMaintenanceRoom(room));
}

export function parseTimeOfDayToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);

  if (
    hours === undefined ||
    minutes === undefined ||
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    throw new BadRequestException('Time must use HH:mm format.');
  }

  return hours * 60 + minutes;
}

export function getLocalOperationDay(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getLocalTimeMinutes(now: Date = new Date()): number {
  return now.getHours() * 60 + now.getMinutes();
}

export function isSameDayBookingBlocked(
  checkInDate: string,
  config: PublicAdvanceBookingConfig,
  now: Date = new Date(),
): boolean {
  const operationDay = getLocalOperationDay(now);

  if (checkInDate !== operationDay) {
    return false;
  }

  return (
    getLocalTimeMinutes(now) >=
    parseTimeOfDayToMinutes(config.sameDayBookingCutoffTime)
  );
}

export function assertMinimumAdvanceBooking(
  checkInDate: string,
  checkOutDate: string,
  config: PublicAdvanceBookingConfig,
  now: Date = new Date(),
): void {
  if (checkInDate >= checkOutDate) {
    throw new BadRequestException('Check-out must be after check-in.');
  }

  const operationDay = getLocalOperationDay(now);

  if (checkInDate < operationDay) {
    throw new BadRequestException(
      'Check-in date must be today or in the future.',
    );
  }

  if (isSameDayBookingBlocked(checkInDate, config, now)) {
    throw new BadRequestException(
      `Same-day check-in is not available after ${config.sameDayBookingCutoffTime}. Please choose a later check-in date or call us to book.`,
    );
  }
}
