import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db, bookings as bookingsTable, rooms as roomsTable } from '@repo/db';
import {
  bookingResponseSchema,
  createBookingSchema,
  updateBookingSchema,
  type BookingListResponse,
  type BookingResponse,
  type CreateBookingInput,
  type UpdateBookingInput,
} from '@repo/contracts';
import {
  computeBookingStatus,
  type BookingLifecycleStatus,
} from './booking-status';

type BookingRecord = typeof bookingsTable.$inferSelect;
type RoomRecord = typeof roomsTable.$inferSelect;
type BookingLifecycleRecord = {
  checkInDate: string;
  checkOutDate: string;
  isCanceled: boolean;
  checkedOutAt: Date | null;
};

type BookingListQuery = {
  status?: 'all' | BookingLifecycleStatus;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  operationDay?: string;
};

@Injectable()
export class BookingsService {
  async listBookings(query: unknown): Promise<BookingListResponse> {
    const parsedQuery = this.normalizeListQuery(query);
    const operationDay = parsedQuery.operationDay ?? this.getCurrentOperationDay();

    const [bookingRows, roomRows] = await Promise.all([
      db.select().from(bookingsTable),
      db.select().from(roomsTable),
    ]);

    const roomById = new Map((roomRows as RoomRecord[]).map((room) => [room.id, room]));
    const searchTerm = parsedQuery.search?.toLowerCase();

    const responses = (bookingRows as BookingRecord[])
      .map((booking) =>
        this.toBookingResponse(booking, roomById.get(booking.roomId) ?? null, operationDay),
      )
      .filter((booking) => {
        if (parsedQuery.status && parsedQuery.status !== 'all' && booking.status !== parsedQuery.status) {
          return false;
        }

        if (!searchTerm) {
          return true;
        }

        const room = roomById.get(booking.roomId);
        const guestName = booking.guest.name.toLowerCase();
        const roomLabel = room ? `room ${room.number}`.toLowerCase() : '';

        return (
          booking.code.toLowerCase().includes(searchTerm) ||
          guestName.includes(searchTerm) ||
          roomLabel.includes(searchTerm) ||
          booking.guest.phone?.toLowerCase().includes(searchTerm) ||
          booking.handledBy?.toLowerCase().includes(searchTerm)
        );
      })
      .sort((left, right) => this.compareBookings(left, right, parsedQuery.sortBy, parsedQuery.order, roomById));

    const paginate = parsedQuery.page !== undefined || parsedQuery.pageSize !== undefined;
    const pageSize = typeof parsedQuery.pageSize === 'number' ? parsedQuery.pageSize : 10;
    const page = typeof parsedQuery.page === 'number' ? parsedQuery.page : 1;
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

  async createBooking(body: unknown): Promise<BookingResponse> {
    const input = this.parseSchema<CreateBookingInput>(createBookingSchema, body);
    this.validateStayDates(input.checkInDate, input.checkOutDate);

    const room = await this.findRoomById(db, input.roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    await this.ensureNoOverlap(db, {
      roomId: input.roomId,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
    });

    const nights = this.calculateNights(input.checkInDate, input.checkOutDate);
    const totalAmount = this.calculateTotalAmount(room, nights);
    const paidAmount = Math.min(input.paidAmount, totalAmount);
    const code = await this.generateBookingCode(db);

    const insertedRows = await db
      .insert(bookingsTable)
      .values({
        id: this.createBookingId(),
        code,
        roomId: input.roomId,
        guestName: input.guestName,
        guestPhone: input.guestPhone ?? null,
        guestIdNumber: input.guestIdNumber ?? null,
        handledBy: input.handledBy ?? null,
        isCanceled: false,
        checkedOutAt: null,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        paidAmount,
        source: input.source ?? 'walk-in',
      })
      .returning();

    const booking = insertedRows[0];

    if (!booking) {
      throw new BadRequestException('Failed to create booking.');
    }

    return this.toBookingResponse(booking, room, this.getCurrentOperationDay());
  }

  async updateBooking(id: string, body: unknown): Promise<BookingResponse> {
    const input = this.parseSchema<UpdateBookingInput>(updateBookingSchema, body);
    this.validateStayDates(input.checkInDate, input.checkOutDate);

    const existingBooking = await this.findBookingById(db, id);

    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }

    const room = await this.findRoomById(db, input.roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    await this.ensureNoOverlap(db, {
      roomId: input.roomId,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      ignoreBookingId: id,
    });

    const nights = this.calculateNights(input.checkInDate, input.checkOutDate);
    const totalAmount = this.calculateTotalAmount(room, nights);
    const paidAmount = Math.min(input.paidAmount, totalAmount);
    const lifecycle = existingBooking as BookingRecord & BookingLifecycleRecord;

    const updatedRows = await db
      .update(bookingsTable)
      .set({
        roomId: input.roomId,
        guestName: input.guestName,
        guestPhone: input.guestPhone ?? null,
        guestIdNumber: input.guestIdNumber ?? null,
        handledBy: input.handledBy ?? null,
        isCanceled: lifecycle.isCanceled,
        checkedOutAt: lifecycle.checkedOutAt,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        paidAmount,
        source: input.source ?? existingBooking.source,
      })
      .where(eq(bookingsTable.id, id))
      .returning();

    const updatedBooking = updatedRows[0];

    if (!updatedBooking) {
      throw new NotFoundException('Booking not found');
    }

    return this.toBookingResponse(updatedBooking, room, this.getCurrentOperationDay());
  }

  async cancelBooking(id: string): Promise<BookingResponse> {
    const existingBooking = await this.findBookingById(db, id);

    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }

    const room = await this.findRoomById(db, existingBooking.roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const updatedRows = await db
      .update(bookingsTable)
      .set({ isCanceled: true })
      .where(eq(bookingsTable.id, id))
      .returning();

    const cancelledBooking = updatedRows[0];

    if (!cancelledBooking) {
      throw new NotFoundException('Booking not found');
    }

    if (room.manualStatus !== 'maintenance') {
      await db
        .update(roomsTable)
        .set({ manualStatus: 'available' })
        .where(eq(roomsTable.id, room.id));
    }

    return this.toBookingResponse(cancelledBooking, room, this.getCurrentOperationDay());
  }

  async checkoutBooking(id: string): Promise<BookingResponse> {
    const existingBooking = await this.findBookingById(db, id);

    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }

    const lifecycle = existingBooking as BookingRecord & BookingLifecycleRecord;

    if (lifecycle.isCanceled) {
      throw new ConflictException('Cancelled bookings cannot be checked out.');
    }

    const room = await this.findRoomById(db, existingBooking.roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const operationDay = this.getCurrentOperationDay();
    const checkoutNights = this.calculateNights(existingBooking.checkInDate, operationDay);
    const totalAmount = this.calculateTotalAmount(room, checkoutNights);
    const paidAmount = Math.min(existingBooking.paidAmount ?? 0, totalAmount);

    const updatedRows = await db
      .update(bookingsTable)
      .set({
        checkedOutAt: new Date(),
        paidAmount,
      })
      .where(eq(bookingsTable.id, id))
      .returning();

    const updatedBooking = updatedRows[0];

    if (!updatedBooking) {
      throw new NotFoundException('Booking not found');
    }

    if (room.manualStatus !== 'maintenance') {
      await db
        .update(roomsTable)
        .set({ manualStatus: 'cleaning' })
        .where(eq(roomsTable.id, room.id));
    }

    return this.toBookingResponse(updatedBooking, room, this.getCurrentOperationDay());
  }

  private parseSchema<T>(
    schema: { safeParse(value: unknown): unknown },
    value: unknown,
  ): T {
    const result = schema.safeParse(value) as {
      success: boolean;
      data?: T;
      error?:
        | {
            issues: Array<{ message: string }>;
          }
        | undefined;
    };

    if (!result.success) {
      throw new BadRequestException(
        result.error?.issues[0]?.message ?? 'Invalid request payload.',
      );
    }

    return result.data as T;
  }

  private normalizeListQuery(query: unknown): BookingListQuery {
    const record =
      typeof query === 'object' && query !== null && !Array.isArray(query)
        ? (query as Record<string, unknown>)
        : {};

    return {
      status: this.normalizeBookingStatus(record.status),
      search: this.optionalTrimmedString(record.search),
      page: this.optionalPositiveInteger(record.page),
      pageSize: this.optionalPositiveInteger(record.pageSize),
      sortBy: this.optionalTrimmedString(record.sortBy),
      operationDay: this.parseOperationDayFilter(record.operationDay),
      order:
        record.order === 'asc' || record.order === 'desc'
          ? record.order
          : 'desc',
    };
  }

  private normalizeBookingStatus(value: unknown): BookingListQuery['status'] {
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      value === 'all'
    ) {
      return undefined;
    }

    if (
      value === 'active' ||
      value === 'upcoming' ||
      value === 'checked_out' ||
      value === 'canceled'
    ) {
      return value;
    }

    if (value === 'confirmed') {
      return 'active';
    }

    if (value === 'pending') {
      return 'upcoming';
    }

    if (value === 'cancelled') {
      return 'canceled';
    }

    throw new BadRequestException(
      'status must be one of: all, active, upcoming, checked_out, canceled.',
    );
  }

  private parseOperationDayFilter(value: unknown): string | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('operationDay must be a string.');
    }

    return this.parseOperationDay(value);
  }

  private optionalTrimmedString(value: unknown): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('Query values must be strings.');
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private optionalPositiveInteger(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const parsed = typeof value === 'number' ? value : Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException(
        'page and pageSize must be positive integers.',
      );
    }

    return parsed;
  }

  private compareBookings(
    left: BookingResponse,
    right: BookingResponse,
    sortBy?: string,
    order: BookingListQuery['order'] = 'desc',
    roomById?: Map<string, RoomRecord>,
  ): number {
    let result = 0;

    if (!sortBy || sortBy === 'createdAt') {
      result = right.createdAt.localeCompare(left.createdAt);
    } else if (sortBy === 'roomNumber') {
      const leftRoom = roomById?.get(left.roomId);
      const rightRoom = roomById?.get(right.roomId);

      result = (leftRoom?.number ?? '').localeCompare(
        rightRoom?.number ?? '',
        undefined,
        {
          numeric: true,
          sensitivity: 'base',
        },
      );
    } else {
      switch (sortBy) {
        case 'code':
          result = left.code.localeCompare(right.code, undefined, {
            numeric: true,
            sensitivity: 'base',
          });
          break;
        case 'guestName':
          result = left.guest.name.localeCompare(right.guest.name, undefined, {
            numeric: true,
            sensitivity: 'base',
          });
          break;
        case 'status':
          result = left.status.localeCompare(right.status, undefined, {
            numeric: true,
            sensitivity: 'base',
          });
          break;
        case 'source':
          result = left.source.localeCompare(right.source, undefined, {
            numeric: true,
            sensitivity: 'base',
          });
          break;
        case 'paymentStatus':
          result = left.paymentStatus.localeCompare(
            right.paymentStatus,
            undefined,
            {
              numeric: true,
              sensitivity: 'base',
            },
          );
          break;
        case 'checkInDate':
          result = left.checkInDate.localeCompare(right.checkInDate);
          break;
        case 'checkOutDate':
          result = left.checkOutDate.localeCompare(right.checkOutDate);
          break;
        case 'dueDate':
          result = (left.dueDate ?? '').localeCompare(right.dueDate ?? '');
          break;
        case 'nights':
          result = left.nights - right.nights;
          break;
        case 'totalAmount':
          result = left.totalAmount - right.totalAmount;
          break;
        case 'paidAmount':
          result = left.paidAmount - right.paidAmount;
          break;
        case 'remainingAmount':
          result = left.remainingAmount - right.remainingAmount;
          break;
        default:
          throw new BadRequestException('Invalid sort field.');
      }
    }

    return order === 'desc' ? -result : result;
  }

  private async findRoomById(
    database: typeof db,
    roomId: string,
  ): Promise<RoomRecord | undefined> {
    const rooms = (await database
      .select()
      .from(roomsTable)
      .where(eq(roomsTable.id, roomId))
      .limit(1)) as RoomRecord[];

    return rooms[0];
  }

  private async findBookingById(
    database: typeof db,
    id: string,
  ): Promise<BookingRecord | undefined> {
    const bookings = (await database
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, id))
      .limit(1)) as BookingRecord[];

    return bookings[0];
  }

  private async ensureNoOverlap(
    database: typeof db,
    input: {
      roomId: string;
      checkInDate: string;
      checkOutDate: string;
      ignoreBookingId?: string;
    },
  ): Promise<void> {
    const roomBookings = (await database
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.roomId, input.roomId))) as BookingRecord[];

    const currentOperationDay = this.getCurrentOperationDay();

    const conflict = roomBookings.find((booking) => {
      const lifecycle = booking as BookingRecord & BookingLifecycleRecord;
      const bookingStatus = computeBookingStatus(lifecycle, currentOperationDay);

      if (bookingStatus === 'canceled' || bookingStatus === 'checked_out') {
        return false;
      }

      if (input.ignoreBookingId && booking.id === input.ignoreBookingId) {
        return false;
      }

      return (
        input.checkInDate < booking.checkOutDate &&
        input.checkOutDate > booking.checkInDate
      );
    });

    if (conflict) {
      throw new ConflictException(
        `Room already booked in this period (${conflict.code}).`,
      );
    }
  }

  private toBookingResponse(
    booking: BookingRecord,
    room: RoomRecord | null,
    operationDay: string,
  ): BookingResponse {
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const lifecycle = booking as BookingRecord & BookingLifecycleRecord;
    const nights = this.calculateNights(booking.checkInDate, booking.checkOutDate);
    const totalAmount = this.calculateTotalAmount(room, nights);
    const paidAmount = Math.min(booking.paidAmount ?? 0, totalAmount);
    const remainingAmount = Math.max(totalAmount - paidAmount, 0);
    const checkedOutAt = lifecycle.checkedOutAt ? this.toIsoString(lifecycle.checkedOutAt) : null;
    const status = computeBookingStatus(lifecycle, operationDay);

    const response = {
      id: booking.id,
      code: booking.code,
      guest: {
        name: booking.guestName,
        phone: booking.guestPhone ?? undefined,
        idNumber: booking.guestIdNumber ?? undefined,
      },
      handledBy: booking.handledBy ?? undefined,
      roomId: booking.roomId,
      status,
      isCanceled: lifecycle.isCanceled,
      checkedOutAt,
      checkIn: booking.checkInDate,
      checkOut: booking.checkOutDate,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      nights,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentStatus: this.derivePaymentStatus(totalAmount, paidAmount),
      dueDate: remainingAmount > 0 ? booking.checkOutDate : undefined,
      createdAt: this.toIsoString(booking.createdAt),
      source: booking.source,
    } satisfies BookingResponse;

    return bookingResponseSchema.parse(response);
  }

  private validateStayDates(checkInDate: string, checkOutDate: string): void {
    if (checkInDate >= checkOutDate) {
      throw new BadRequestException(
        'Check-out date must be after check-in date.',
      );
    }
  }

  private calculateNights(checkInDate: string, checkOutDate: string): number {
    this.validateStayDates(checkInDate, checkOutDate);

    const start = this.parseIsoDate(checkInDate).getTime();
    const end = this.parseIsoDate(checkOutDate).getTime();
    const dayMs = 1000 * 60 * 60 * 24;

    return Math.round((end - start) / dayMs);
  }

  private calculateTotalAmount(room: RoomRecord, nights: number): number {
    return room.pricePerNight * nights;
  }

  private derivePaymentStatus(
    totalAmount: number,
    paidAmount: number,
  ): BookingResponse['paymentStatus'] {
    if (paidAmount <= 0) {
      return 'unpaid';
    }

    if (paidAmount >= totalAmount) {
      return 'paid';
    }

    return 'partial';
  }

  private async generateBookingCode(database: typeof db): Promise<string> {
    const bookingRows = (await database
      .select({ id: bookingsTable.id })
      .from(bookingsTable)) as Array<{ id: string }>;

    let candidateIndex = bookingRows.length + 1;

    while (true) {
      const candidate = this.createBookingCode(candidateIndex);
      const existing = (await database
        .select({ id: bookingsTable.id })
        .from(bookingsTable)
        .where(eq(bookingsTable.code, candidate))
        .limit(1)) as Array<{ id: string }>;

      if (!existing[0]) {
        return candidate;
      }

      candidateIndex += 1;
    }
  }

  private createBookingCode(index: number): string {
    return `BG-${new Date().getUTCFullYear()}-AUTO-${String(index).padStart(3, '0')}`;
  }

  private createBookingId(): string {
    return `book-${randomUUID().slice(0, 8)}`;
  }

  private parseOperationDay(value: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException('operationDay must be in YYYY-MM-DD format.');
    }

    return value;
  }

  private parseIsoDate(value: string): Date {
    return new Date(`${value}T00:00:00Z`);
  }

  private toIsoString(value: Date): string {
    return value.toISOString();
  }

  private getCurrentOperationDay(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
