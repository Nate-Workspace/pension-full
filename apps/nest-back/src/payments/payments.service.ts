import { BadRequestException, Injectable } from '@nestjs/common';
import { db, bookings as bookingsTable, payments as paymentsTable, rooms as roomsTable } from '@repo/db';
import {
  listPaymentsQuerySchema,
  type ListPaymentsQueryInput,
  type PaymentListResponse,
} from '@repo/contracts';

type BookingRecord = typeof bookingsTable.$inferSelect;
type PaymentRecord = typeof paymentsTable.$inferSelect;
type RoomRecord = typeof roomsTable.$inferSelect;

type PaymentMethod = 'cash' | 'mobile_money';
type PaymentStatus = 'paid' | 'partial' | 'unpaid';

type ListPaymentsQuery = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  method?: string;
  status?: string;
  search?: string;
};

type DateQuery = {
  operationDay?: string;
};

type TrendsQuery = {
  operationDay?: string;
  days?: string;
};

@Injectable()
export class PaymentsService {
  async listPayments(query: unknown): Promise<PaymentListResponse> {
    const parsed = this.parseSchema<ListPaymentsQueryInput>(listPaymentsQuerySchema, query);

    const [paymentRows, bookingRows, roomRows] = await Promise.all([
      db.select().from(paymentsTable),
      db.select().from(bookingsTable),
      db.select().from(roomsTable),
    ]);

    const bookings = bookingRows as BookingRecord[];
    const payments = paymentRows as PaymentRecord[];
    const rooms = roomRows as RoomRecord[];

    const bookingById = new Map(bookings.map((booking) => [booking.id, booking]));
    const roomById = new Map(rooms.map((room) => [room.id, room]));
    const paidByBooking = this.aggregatePaidByBooking(payments);
    const searchTerm = parsed.search?.toLowerCase();

    const responses = payments
      .filter((payment) => !parsed.method || payment.method === parsed.method)
      .map((payment) => {
        const booking = bookingById.get(payment.bookingId);
        const room = roomById.get(payment.roomId);
        const bookingTotal = booking && room
          ? this.calculateTotalAmount(booking, room)
          : 0;
        const paidTotal = paidByBooking.get(payment.bookingId) ?? 0;

        return {
          id: payment.id,
          bookingId: payment.bookingId,
          roomId: payment.roomId,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
          paidAt: payment.paidAt ? payment.paidAt.toISOString() : undefined,
          reference: payment.reference,
          bookingCode: booking?.code ?? 'N/A',
          guestName: booking?.guestName ?? 'Unknown',
          guestPhone: booking?.guestPhone ?? undefined,
          roomNumber: room?.number ?? 'N/A',
          outstanding: Math.max(bookingTotal - paidTotal, 0),
        };
      })
      .filter((payment) => !parsed.status || parsed.status === 'all' || payment.status === parsed.status)
      .filter((payment) => {
        if (!searchTerm) {
          return true;
        }

        return (
          payment.reference.toLowerCase().includes(searchTerm) ||
          payment.bookingCode.toLowerCase().includes(searchTerm) ||
          payment.guestName.toLowerCase().includes(searchTerm) ||
          payment.roomNumber.toLowerCase().includes(searchTerm)
        );
      })
      .sort((left, right) => this.comparePayments(left, right, parsed.sortBy, parsed.order));

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

  async getSummary(query: unknown) {
    const parsed = this.parseDateQuery(query);
    const operationDay = parsed.operationDay ?? this.getCurrentOperationDay();
    const monthPrefix = operationDay.slice(0, 7);

    const [paymentRows, bookingRows, roomRows] = await Promise.all([
      db.select().from(paymentsTable),
      db.select().from(bookingsTable),
      db.select().from(roomsTable),
    ]);

    const payments = paymentRows as PaymentRecord[];
    const bookings = (bookingRows as BookingRecord[]).filter(
      (booking) => booking.status !== 'cancelled',
    );
    const roomById = new Map((roomRows as RoomRecord[]).map((room) => [room.id, room]));

    const paidByBooking = this.aggregatePaidByBooking(payments);

    const dailyCollected = payments
      .filter((payment) => payment.paidAt && this.toIsoDate(payment.paidAt) === operationDay)
      .reduce((sum, payment) => sum + payment.amount, 0);

    const monthlyCollected = payments
      .filter((payment) => payment.paidAt && this.toIsoDate(payment.paidAt).startsWith(monthPrefix))
      .reduce((sum, payment) => sum + payment.amount, 0);

    let outstandingBalances = 0;
    let unpaidCount = 0;
    let partialCount = 0;

    bookings.forEach((booking) => {
      const room = roomById.get(booking.roomId);

      if (!room) {
        return;
      }

      const totalAmount = this.calculateTotalAmount(booking, room);
      const paidAmount = Math.min(paidByBooking.get(booking.id) ?? 0, totalAmount);
      const remaining = Math.max(totalAmount - paidAmount, 0);

      outstandingBalances += remaining;

      if (paidAmount <= 0 && remaining > 0) {
        unpaidCount += 1;
        return;
      }

      if (paidAmount > 0 && paidAmount < totalAmount) {
        partialCount += 1;
      }
    });

    return {
      operationDay,
      dailyCollected,
      monthlyCollected,
      outstandingBalances,
      unpaidCount,
      partialCount,
    };
  }

  async getTrends(query: unknown) {
    const parsed = this.parseTrendsQuery(query);
    const operationDay = parsed.operationDay ?? this.getCurrentOperationDay();
    const days = parsed.days ?? 7;

    const paymentRows = (await db.select().from(paymentsTable)) as PaymentRecord[];

    const daily = Array.from({ length: days }, (_, index) => {
      const day = this.addDays(operationDay, index - (days - 1));
      const value = paymentRows
        .filter((payment) => payment.paidAt && this.toIsoDate(payment.paidAt) === day)
        .reduce((sum, payment) => sum + payment.amount, 0);

      return {
        day,
        label: this.toDayLabel(day),
        value,
      };
    });

    const byMethod = [
      {
        method: 'cash' as const,
        value: paymentRows
          .filter((payment) => payment.method === 'cash')
          .reduce((sum, payment) => sum + payment.amount, 0),
      },
      {
        method: 'mobile_money' as const,
        value: paymentRows
          .filter((payment) => payment.method === 'mobile_money')
          .reduce((sum, payment) => sum + payment.amount, 0),
      },
    ];

    return {
      operationDay,
      daily,
      byMethod,
    };
  }

  private parseDateQuery(query: unknown): DateQuery {
    const record = this.toRecord(query);
    const operationDay = this.optionalIsoDate(record.operationDay);

    return {
      operationDay,
    };
  }

  private parseTrendsQuery(query: unknown): { operationDay?: string; days?: number } {
    const record = this.toRecord(query);
    const operationDay = this.optionalIsoDate(record.operationDay);
    const days = this.optionalPositiveInteger(record.days, 'days must be a positive number between 1 and 31.');

    if (days !== undefined && (days < 1 || days > 31)) {
      throw new BadRequestException('days must be between 1 and 31.');
    }

    return {
      operationDay,
      days,
    };
  }

  private aggregatePaidByBooking(payments: PaymentRecord[]): Map<string, number> {
    return payments.reduce<Map<string, number>>((map, payment) => {
      const current = map.get(payment.bookingId) ?? 0;
      map.set(payment.bookingId, current + payment.amount);
      return map;
    }, new Map<string, number>());
  }

  private calculateTotalAmount(booking: BookingRecord, room: RoomRecord): number {
    const nights = this.calculateNights(booking.checkInDate, booking.checkOutDate);
    return room.pricePerNight * nights;
  }

  private calculateNights(checkInDate: string, checkOutDate: string): number {
    const start = this.parseIsoDate(checkInDate).getTime();
    const end = this.parseIsoDate(checkOutDate).getTime();
    const dayMs = 1000 * 60 * 60 * 24;
    const diff = Math.round((end - start) / dayMs);

    return Math.max(diff, 0);
  }

  private optionalPaymentMethod(value: unknown): PaymentMethod | undefined {
    if (value === undefined || value === null || value === '' || value === 'all') {
      return undefined;
    }

    if (value === 'cash' || value === 'mobile_money') {
      return value;
    }

    throw new BadRequestException('method must be one of: all, cash, mobile_money.');
  }

  private optionalTrimmedString(value: unknown): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('search must be a string.');
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private optionalIsoDate(value: unknown): string | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException('operationDay must be in YYYY-MM-DD format.');
    }

    return value;
  }

  private optionalPositiveInteger(value: unknown, message: string): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const parsed = typeof value === 'number' ? value : Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException(message);
    }

    return parsed;
  }

  private toRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, unknown>;
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

  private comparePayments(
    left: { paidAt?: string; method: PaymentMethod; status: PaymentStatus; amount: number; bookingCode: string; guestName: string; roomNumber: string; reference: string },
    right: { paidAt?: string; method: PaymentMethod; status: PaymentStatus; amount: number; bookingCode: string; guestName: string; roomNumber: string; reference: string },
    sortBy?: ListPaymentsQueryInput['sortBy'],
    order: ListPaymentsQueryInput['order'] = 'desc',
  ): number {
    let result = 0;

    if (!sortBy || sortBy === 'paidAt') {
      result = (right.paidAt ?? '').localeCompare(left.paidAt ?? '');
    } else if (sortBy === 'amount' || sortBy === 'outstanding') {
      result = left[sortBy] - right[sortBy];
    } else if (sortBy === 'method' || sortBy === 'status' || sortBy === 'reference' || sortBy === 'bookingCode' || sortBy === 'guestName' || sortBy === 'roomNumber') {
      result = String(left[sortBy]).localeCompare(String(right[sortBy]), undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    } else {
      throw new BadRequestException('Invalid sort field.');
    }

    return order === 'desc' ? -result : result;
  }

  private parseIsoDate(value: string): Date {
    return new Date(`${value}T00:00:00Z`);
  }

  private toIsoDate(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private addDays(day: string, days: number): string {
    const value = this.parseIsoDate(day);
    value.setUTCDate(value.getUTCDate() + days);
    return this.toIsoDate(value);
  }

  private toDayLabel(isoDate: string): string {
    return this.parseIsoDate(isoDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  private getCurrentOperationDay(): string {
    return this.toIsoDate(new Date());
  }
}
