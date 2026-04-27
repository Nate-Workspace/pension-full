import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, ilike } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db, bookings as bookingsTable, rooms as roomsTable } from '@repo/db';
import {
  availableRoomsQuerySchema,
  listRoomsQuerySchema,
  type AvailableRoomsQueryInput,
  type ListRoomsQueryInput,
  type RoomListResponse,
} from '@repo/contracts';
import {
  computeBookingStatus,
  type BookingLifecycleStatus,
} from '../bookings/booking-status';

type RoomRecord = typeof roomsTable.$inferSelect;
type BookingLifecycleRecord = BookingRecord & {
  isCanceled: boolean;
  checkedOutAt?: Date | null;
};
type BookingRecord = typeof bookingsTable.$inferSelect;
type RoomType = 'single' | 'double' | 'vip';
type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance';
type RoomManualStatus = 'available' | 'cleaning' | 'maintenance';
type RoomCurrentGuest = {
  name: string;
  phone?: string;
  idNumber?: string;
};

type RoomResponseRow = {
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
  currentGuest?: RoomCurrentGuest;
};

type CreateRoomInput = {
  number: string;
  floor: number;
  type: RoomType;
  status: RoomStatus;
  capacity: number;
  pricePerNight: number;
  assignedTo?: string | null;
};

type UpdateRoomInput = {
  number: string;
  floor: number;
  type: RoomType;
  capacity: number;
  pricePerNight: number;
  assignedTo?: string | null;
};

type RoomStatusUpdateInput = {
  status: RoomStatus;
};

type RoomListQuery = ListRoomsQueryInput;

@Injectable()
export class RoomsService {
  async listAvailableRooms(query: unknown): Promise<RoomResponseRow[]> {
    const parsedQuery = this.parseSchema<AvailableRoomsQueryInput>(availableRoomsQuerySchema, query);
    const checkIn = parsedQuery.checkIn;
    const checkOut = parsedQuery.checkOut;

    if (checkOut <= checkIn) {
      throw new BadRequestException('checkOut must be after checkIn.');
    }

    const roomRows = (await db.select().from(roomsTable)) as RoomRecord[];
    const bookingRows = (await db.select().from(bookingsTable)) as BookingRecord[];

    const overlappingRoomIds = new Set(
      bookingRows
        .filter((booking) => {
          if (parsedQuery.excludeBookingId && booking.id === parsedQuery.excludeBookingId) {
            return false;
          }

          const lifecycle = booking as BookingLifecycleRecord;
          if (lifecycle.isCanceled || lifecycle.checkedOutAt) {
            return false;
          }

          return booking.checkInDate < checkOut && booking.checkOutDate > checkIn;
        })
        .map((booking) => booking.roomId),
    );

    return roomRows
      .filter((room) => room.manualStatus === 'available')
      .filter((room) => !overlappingRoomIds.has(room.id))
      .sort((left, right) => {
        const floorDiff = left.floor - right.floor;
        if (floorDiff !== 0) {
          return floorDiff;
        }

        return left.number.localeCompare(right.number, undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      })
      .map((room) => this.toRoomResponse(room, null));
  }

  async getRoomById(id: string, operationDay?: string): Promise<RoomResponseRow> {
    const room = await this.findRoomById(id);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const resolvedOperationDay =
      this.normalizeOperationDay(operationDay) ?? this.getCurrentOperationDay();
    const activeBooking = await this.findActiveBookingForRoom(id, resolvedOperationDay);

    return this.toRoomResponse(room, activeBooking);
  }

  async listRooms(query: RoomListQuery): Promise<RoomListResponse> {
    const parsed = this.parseSchema<ListRoomsQueryInput>(listRoomsQuerySchema, query);
    const resolvedOperationDay = parsed.operationDay ?? this.getCurrentOperationDay();

    const roomRows = (await db.select().from(roomsTable)) as RoomRecord[];
    const bookingRows = (await db
      .select()
      .from(bookingsTable)) as BookingRecord[];

    const activeBookingByRoomId = this.buildActiveBookingMap(
      bookingRows,
      resolvedOperationDay,
    );

    const searchTerm = parsed.search?.toLowerCase();

    const responses = roomRows
      .map((room) =>
        this.toRoomResponse(room, activeBookingByRoomId.get(room.id) ?? null),
      )
      .filter((room) => {
        if (parsed.status && parsed.status !== 'all' && room.status !== parsed.status) {
          return false;
        }

        if (parsed.type && room.type !== parsed.type) {
          return false;
        }

        if (!searchTerm) {
          return true;
        }

        const currentGuest = room.currentGuest;
        const assignedTo = room.assignedTo?.toLowerCase() ?? '';

        return (
          room.name.toLowerCase().includes(searchTerm) ||
          room.number.toLowerCase().includes(searchTerm) ||
          assignedTo.includes(searchTerm) ||
          currentGuest?.name.toLowerCase().includes(searchTerm) ||
          currentGuest?.phone?.toLowerCase().includes(searchTerm) ||
          currentGuest?.idNumber?.toLowerCase().includes(searchTerm)
        );
      })
      .sort((left, right) => {
        return this.compareRooms(left, right, parsed.sortBy, parsed.order);
      });

    const paginate = parsed.page !== undefined || parsed.pageSize !== undefined;
    const pageSize = parsed.pageSize ?? 10;
    const page = parsed.page ?? 1;
    const total = responses.length;
    const totalPages = paginate ? (total > 0 ? Math.ceil(total / pageSize) : 0) : total > 0 ? 1 : 0;
    const startIndex = (page - 1) * pageSize;

    return {
      data: paginate ? responses.slice(startIndex, startIndex + pageSize) : responses,
      meta: {
        page,
        pageSize: paginate ? pageSize : total > 0 ? total : 1,
        total,
        totalPages,
      },
    };
  }

  async createRoom(body: unknown): Promise<RoomResponseRow> {
    const input = this.parseCreateInput(body);
    const normalizedNumber = input.number.trim();
    await this.ensureRoomNumberIsUnique(normalizedNumber);

    const roomRecord = await this.insertRoom({
      id: this.createRoomId(normalizedNumber),
      name: `Room ${normalizedNumber}`,
      number: normalizedNumber,
      floor: input.floor,
      type: input.type,
      manualStatus: this.toStoredManualStatus(input.status),
      pricePerNight: input.pricePerNight,
      capacity: input.capacity,
      assignedTo: this.normalizeAssignedTo(input.assignedTo),
    });

    return this.toRoomResponse(roomRecord, null);
  }

  async updateRoom(id: string, body: unknown): Promise<RoomResponseRow> {
    const input = this.parseUpdateInput(body);
    const existingRoom = await this.findRoomById(id);

    if (!existingRoom) {
      throw new NotFoundException('Room not found');
    }

    const nextNumber = input.number.trim();

    if (nextNumber.toLowerCase() !== existingRoom.number.toLowerCase()) {
      await this.ensureRoomNumberIsUnique(nextNumber, existingRoom.id);
    }

    const updatedRows = await db
      .update(roomsTable)
      .set({
        name: `Room ${nextNumber}`,
        number: nextNumber,
        floor: input.floor,
        type: input.type,
        pricePerNight: input.pricePerNight,
        capacity: input.capacity,
        assignedTo:
          input.assignedTo === undefined
            ? existingRoom.assignedTo
            : this.normalizeAssignedTo(input.assignedTo),
      })
      .where(eq(roomsTable.id, id))
      .returning();

    const updatedRoom = updatedRows[0];

    if (!updatedRoom) {
      throw new NotFoundException('Room not found');
    }

    const activeBooking = await this.findActiveBookingForRoom(
      updatedRoom.id,
      this.getCurrentOperationDay(),
    );

    return this.toRoomResponse(updatedRoom, activeBooking);
  }

  async updateRoomStatus(id: string, body: unknown): Promise<RoomResponseRow> {
    const input = this.parseStatusUpdateInput(body);
    const existingRoom = await this.findRoomById(id);

    if (!existingRoom) {
      throw new NotFoundException('Room not found');
    }

    const operationDay = this.getCurrentOperationDay();
    const activeBooking = await this.findActiveBookingForRoom(id, operationDay);

    if (input.status === 'available' && activeBooking) {
      throw new ConflictException(
        'Room cannot be set to available while an active booking exists.',
      );
    }

    const nextManualStatus =
      input.status === 'occupied'
        ? existingRoom.manualStatus
        : this.toStoredManualStatus(input.status);

    const updatedRows = await db
      .update(roomsTable)
      .set({
        manualStatus: nextManualStatus,
      })
      .where(eq(roomsTable.id, id))
      .returning();

    const updatedRoom = updatedRows[0];

    if (!updatedRoom) {
      throw new NotFoundException('Room not found');
    }

    const latestActiveBooking = await this.findActiveBookingForRoom(
      updatedRoom.id,
      operationDay,
    );

    return this.toRoomResponse(updatedRoom, latestActiveBooking);
  }

  private parseCreateInput(body: unknown): CreateRoomInput {
    const record = this.toRecord(body);

    return {
      number: this.requireTrimmedString(
        record.number,
        'Room number is required.',
      ),
      floor: this.requirePositiveInteger(
        record.floor,
        'Floor must be a valid positive number.',
      ),
      type: this.requireRoomType(record.type),
      status: this.requireRoomStatus(record.status),
      capacity: this.requirePositiveInteger(
        record.capacity,
        'Capacity must be a valid positive number.',
      ),
      pricePerNight: this.requirePositiveInteger(
        record.pricePerNight,
        'Price per night must be a valid positive amount.',
      ),
      assignedTo: this.normalizeAssignedTo(record.assignedTo),
    };
  }

  private parseUpdateInput(body: unknown): UpdateRoomInput {
    const record = this.toRecord(body);

    return {
      number: this.requireTrimmedString(
        record.number,
        'Room number is required.',
      ),
      floor: this.requirePositiveInteger(
        record.floor,
        'Floor must be a valid positive number.',
      ),
      type: this.requireRoomType(record.type),
      capacity: this.requirePositiveInteger(
        record.capacity,
        'Capacity must be a valid positive number.',
      ),
      pricePerNight: this.requirePositiveInteger(
        record.pricePerNight,
        'Price per night must be a valid positive amount.',
      ),
      assignedTo: this.normalizeAssignedTo(record.assignedTo),
    };
  }

  private parseStatusUpdateInput(body: unknown): RoomStatusUpdateInput {
    const record = this.toRecord(body);

    return {
      status: this.requireRoomStatus(record.status),
    };
  }

  private async findRoomById(id: string): Promise<RoomRecord | undefined> {
    const rooms = (await db
      .select()
      .from(roomsTable)
      .where(eq(roomsTable.id, id))
      .limit(1)) as RoomRecord[];
    const room = rooms[0];
    return room;
  }

  private async ensureRoomNumberIsUnique(
    number: string,
    roomIdToIgnore?: string,
  ): Promise<void> {
    const existingRooms = (await db
      .select({ id: roomsTable.id })
      .from(roomsTable)
      .where(ilike(roomsTable.number, number))
      .limit(1)) as Array<{ id: string }>;
    const existingRoom = existingRooms[0];

    if (existingRoom && existingRoom.id !== roomIdToIgnore) {
      throw new ConflictException(`Room ${number} already exists.`);
    }
  }

  private async insertRoom(
    values: typeof roomsTable.$inferInsert,
  ): Promise<RoomRecord> {
    try {
      const insertedRooms = await db
        .insert(roomsTable)
        .values(values)
        .returning();
      const room = insertedRooms[0];

      if (!room) {
        throw new Error('Failed to create room');
      }

      return room;
    } catch (error: unknown) {
      this.handleUniqueViolation(error, 'Room already exists');
      throw error;
    }
  }

  private buildActiveBookingMap(
    bookings: BookingRecord[],
    operationDay: string,
  ): Map<string, BookingRecord> {
    const activeBookingByRoomId = new Map<string, BookingRecord>();

    for (const booking of bookings) {
      if (!this.isActiveBookingOn(operationDay, booking as BookingLifecycleRecord)) {
        continue;
      }

      activeBookingByRoomId.set(booking.roomId, booking);
    }

    return activeBookingByRoomId;
  }

  private async findActiveBookingForRoom(
    roomId: string,
    operationDay: string,
  ): Promise<BookingRecord | null> {
    const roomBookings = (await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.roomId, roomId))) as BookingRecord[];

    return (
      roomBookings.find((booking) => this.isActiveBookingOn(operationDay, booking as BookingLifecycleRecord)) ?? null
    );
  }

  private isActiveBookingOn(
    operationDay: string,
    booking: BookingLifecycleRecord,
  ): boolean {
    return computeBookingStatus(booking, operationDay) === 'active';
  }

  private resolveEffectiveStatus(
    manualStatus: RoomRecord['manualStatus'],
    activeBooking: BookingRecord | null,
  ): RoomStatus {
    if (manualStatus === 'maintenance') {
      return 'maintenance';
    }

    if (activeBooking) {
      return 'occupied';
    }

    if (manualStatus === 'cleaning') {
      return 'cleaning';
    }

    return 'available';
  }

  private toRoomResponse(
    room: RoomRecord,
    activeBooking: BookingRecord | null,
  ): RoomResponseRow {
    const status = this.resolveEffectiveStatus(
      room.manualStatus,
      activeBooking,
    );

    const response: RoomResponseRow = {
      id: room.id,
      name: room.name,
      number: room.number,
      floor: room.floor,
      type: room.type,
      status,
      price: room.pricePerNight,
      pricePerNight: room.pricePerNight,
      capacity: room.capacity,
      assignedTo: room.assignedTo ?? undefined,
      currentGuest:
        status === 'occupied' && activeBooking
          ? {
              name: activeBooking.guestName,
              phone: activeBooking.guestPhone ?? undefined,
              idNumber: activeBooking.guestIdNumber ?? undefined,
            }
          : undefined,
    };

    return response;
  }

  private normalizeAssignedTo(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('Assigned to must be a string or null.');
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private toStoredManualStatus(
    status: RoomStatus | 'occupied',
  ): RoomManualStatus {
    if (
      status === 'cleaning' ||
      status === 'maintenance' ||
      status === 'available'
    ) {
      return status;
    }

    return 'available';
  }

  private createRoomId(number: string): string {
    return `room-${number.toLowerCase()}-${randomUUID().slice(0, 8)}`;
  }

  private compareRooms(
    left: RoomResponseRow,
    right: RoomResponseRow,
    sortBy?: ListRoomsQueryInput['sortBy'],
    order: ListRoomsQueryInput['order'] = 'asc',
  ): number {
    let result = 0;

    if (!sortBy) {
      const floorDiff = left.floor - right.floor;

      result = floorDiff !== 0
        ? floorDiff
        : left.number.localeCompare(right.number, undefined, {
            numeric: true,
            sensitivity: 'base',
          });
    } else if (sortBy === 'floor') {
      result = left.floor - right.floor;
    } else if (sortBy === 'number' || sortBy === 'name' || sortBy === 'assignedTo') {
      const leftValue = sortBy === 'assignedTo' ? left.assignedTo ?? '' : left[sortBy];
      const rightValue = sortBy === 'assignedTo' ? right.assignedTo ?? '' : right[sortBy];

      result = leftValue.localeCompare(rightValue, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    } else if (sortBy === 'type') {
      const rank: Record<RoomResponseRow['type'], number> = {
        single: 0,
        double: 1,
        vip: 2,
      };

      result = rank[left.type] - rank[right.type];
    } else if (sortBy === 'status') {
      const rank: Record<RoomResponseRow['status'], number> = {
        available: 0,
        occupied: 1,
        cleaning: 2,
        maintenance: 3,
      };

      result = rank[left.status] - rank[right.status];
    } else if (sortBy === 'capacity' || sortBy === 'price') {
      result = left[sortBy] - right[sortBy];
    } else {
      throw new BadRequestException('Invalid sort field.');
    }

    return order === 'desc' ? -result : result;
  }

  private parseSchema<T>(
    schema: { safeParse(value: unknown): unknown },
    value: unknown,
  ): T {
    const result = schema.safeParse(value) as {
      success: boolean;
      data?: T;
      error?: { issues: Array<{ message: string }> };
    };

    if (!result.success) {
      const error = result.error as { issues: Array<{ message: string }> } | undefined;
      throw new BadRequestException(error?.issues[0]?.message ?? 'Invalid request payload.');
    }

    return result.data as T;
  }

  private getCurrentOperationDay(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private normalizeQuery(query: RoomListQuery): RoomListQuery {
    const status = this.normalizeListStatus(query.status);
    const operationDay = this.normalizeOperationDay(query.operationDay);

    return {
      status,
      operationDay,
    };
  }

  private normalizeListStatus(
    status: string | undefined,
  ): RoomListQuery['status'] | undefined {
    if (status === undefined) {
      return undefined;
    }

    if (
      status === 'all' ||
      status === 'available' ||
      status === 'occupied' ||
      status === 'cleaning' ||
      status === 'maintenance'
    ) {
      return status;
    }

    throw new BadRequestException('Invalid status filter.');
  }

  private normalizeOperationDay(
    operationDay: string | undefined,
  ): string | undefined {
    if (operationDay === undefined) {
      return undefined;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(operationDay)) {
      throw new BadRequestException('operationDay must use YYYY-MM-DD format.');
    }

    return operationDay;
  }

  private toRecord(body: unknown): Record<string, unknown> {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      throw new BadRequestException('Invalid request payload.');
    }

    return body as Record<string, unknown>;
  }

  private requireTrimmedString(value: unknown, message: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException(message);
    }

    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new BadRequestException(message);
    }

    return trimmed;
  }

  private requireRoomType(value: unknown): RoomType {
    if (value === 'single' || value === 'double' || value === 'vip') {
      return value;
    }

    throw new BadRequestException('Invalid room type.');
  }

  private requireRoomStatus(value: unknown): RoomStatus {
    if (
      value === 'available' ||
      value === 'occupied' ||
      value === 'cleaning' ||
      value === 'maintenance'
    ) {
      return value;
    }

    throw new BadRequestException('Invalid room status.');
  }

  private requirePositiveInteger(value: unknown, message: string): number {
    const numericValue =
      typeof value === 'number'
        ? value
        : typeof value === 'string' && value.trim().length > 0
          ? Number(value)
          : Number.NaN;

    if (!Number.isInteger(numericValue) || numericValue <= 0) {
      throw new BadRequestException(message);
    }

    return numericValue;
  }

  private getValidationMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Invalid request payload.';
  }

  private handleUniqueViolation(error: unknown, message: string): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
    ) {
      throw new ConflictException(message);
    }
  }
}
