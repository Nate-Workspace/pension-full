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
  listBookingsQuerySchema,
  updateBookingSchema,
  type BookingResponse,
  type CreateBookingInput,
  type ListBookingsQueryInput,
  type UpdateBookingInput,
} from '@repo/contracts';

type BookingRecord = typeof bookingsTable.$inferSelect;
type RoomRecord = typeof roomsTable.$inferSelect;

@Injectable()
export class BookingsService {
  async listBookings(query: unknown): Promise<BookingResponse[]> {
    const parsedQuery = this.parseSchema<ListBookingsQueryInput>(listBookingsQuerySchema, query);

    const [bookingRows, roomRows] = await Promise.all([
      db.select().from(bookingsTable),
      db.select().from(roomsTable),
    ]);

    const roomById = new Map(roomRows.map((room) => [room.id, room]));
    const searchTerm = parsedQuery.search?.toLowerCase();

    return (bookingRows as BookingRecord[])
      .map((booking) => this.toBookingResponse(booking, roomById.get(booking.roomId) ?? null))
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
          roomLabel.includes(searchTerm)
        );
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async createBooking(body: unknown): Promise<BookingResponse> {
    const input = this.parseSchema<CreateBookingInput>(createBookingSchema, body);
    this.validateStayDates(input.checkInDate, input.checkOutDate);

    const room = await this.findRoomById(db, input.roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (input.status !== 'cancelled') {
      await this.ensureNoOverlap(db, {
        roomId: input.roomId,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
      });
    }

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
        status: input.status,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        paidAmount,
        source: input.source,
      })
      .returning();

    const booking = insertedRows[0];

    if (!booking) {
      throw new BadRequestException('Failed to create booking.');
    }

    return this.toBookingResponse(booking, room);
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

    if (input.status !== 'cancelled') {
      await this.ensureNoOverlap(db, {
        roomId: input.roomId,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        ignoreBookingId: id,
      });
    }

    const nights = this.calculateNights(input.checkInDate, input.checkOutDate);
    const totalAmount = this.calculateTotalAmount(room, nights);
    const paidAmount = Math.min(input.paidAmount, totalAmount);

    const updatedRows = await db
      .update(bookingsTable)
      .set({
        roomId: input.roomId,
        guestName: input.guestName,
        guestPhone: input.guestPhone ?? null,
        guestIdNumber: input.guestIdNumber ?? null,
        handledBy: input.handledBy ?? null,
        status: input.status,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        paidAmount,
        source: input.source,
      })
      .where(eq(bookingsTable.id, id))
      .returning();

    const updatedBooking = updatedRows[0];

    if (!updatedBooking) {
      throw new NotFoundException('Booking not found');
    }

    return this.toBookingResponse(updatedBooking, room);
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
      .set({ status: 'cancelled' })
      .where(eq(bookingsTable.id, id))
      .returning();

    const cancelledBooking = updatedRows[0];

    if (!cancelledBooking) {
      throw new NotFoundException('Booking not found');
    }

    return this.toBookingResponse(cancelledBooking, room);
  }

  async checkoutBooking(id: string): Promise<BookingResponse> {
    const existingBooking = await this.findBookingById(db, id);

    if (!existingBooking) {
      throw new NotFoundException('Booking not found');
    }

    if (existingBooking.status === 'cancelled') {
      throw new ConflictException('Cancelled bookings cannot be checked out.');
    }

    const operationDay = this.getCurrentOperationDay();

    if (operationDay <= existingBooking.checkInDate) {
      throw new BadRequestException('Check-out date must be after check-in date.');
    }

    if (operationDay > existingBooking.checkOutDate) {
      throw new ConflictException('Booking has already ended and cannot be checked out.');
    }

    const room = await this.findRoomById(db, existingBooking.roomId);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const checkoutNights = this.calculateNights(existingBooking.checkInDate, operationDay);
    const totalAmount = this.calculateTotalAmount(room, checkoutNights);
    const paidAmount = Math.min(existingBooking.paidAmount ?? 0, totalAmount);

    const updatedRows = await db
      .update(bookingsTable)
      .set({
        checkOutDate: operationDay,
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

    return this.toBookingResponse(updatedBooking, room);
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

  private async findRoomById(database: typeof db, roomId: string): Promise<RoomRecord | undefined> {
    const rooms = (await database
      .select()
      .from(roomsTable)
      .where(eq(roomsTable.id, roomId))
      .limit(1)) as RoomRecord[];

    return rooms[0];
  }

  private async findBookingById(database: typeof db, id: string): Promise<BookingRecord | undefined> {
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

    const conflict = roomBookings.find((booking) => {
      if (booking.status === 'cancelled') {
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
  ): BookingResponse {
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const nights = this.calculateNights(booking.checkInDate, booking.checkOutDate);
    const totalAmount = this.calculateTotalAmount(room, nights);
    const paidAmount = Math.min(booking.paidAmount ?? 0, totalAmount);
    const remainingAmount = Math.max(totalAmount - paidAmount, 0);

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
      status: booking.status,
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
      throw new BadRequestException('Check-out date must be after check-in date.');
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

  private derivePaymentStatus(totalAmount: number, paidAmount: number): BookingResponse['paymentStatus'] {
    if (paidAmount <= 0) {
      return 'unpaid';
    }

    if (paidAmount >= totalAmount) {
      return 'paid';
    }

    return 'partial';
  }

  private async generateBookingCode(database: typeof db): Promise<string> {
    const bookingRows = (await database.select({ id: bookingsTable.id }).from(bookingsTable)) as Array<{
      id: string;
    }>;

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