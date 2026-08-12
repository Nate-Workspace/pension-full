import { BadRequestException, NotFoundException } from '@nestjs/common';

type PublicRoomRecord = {
  manualStatus: 'available' | 'cleaning' | 'maintenance';
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
