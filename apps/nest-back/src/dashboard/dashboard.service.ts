import { BadRequestException, Injectable } from '@nestjs/common';
import { db, bookings as bookingsTable, rooms as roomsTable } from '@repo/db';
import {
  dashboardSummarySchema,
  dashboardTrendsSchema,
  type DashboardSummary,
  type DashboardTrends,
} from '@repo/contracts';

type BookingRecord = typeof bookingsTable.$inferSelect;
type RoomRecord = typeof roomsTable.$inferSelect;

type SummaryQuery = {
  operationDay?: string;
};

type TrendsQuery = {
  operationDay?: string;
};

@Injectable()
export class DashboardService {
  async getSummary(query: unknown): Promise<DashboardSummary> {
    const operationDay = this.parseOperationDayQuery(query).operationDay ?? this.getCurrentOperationDay();

    const [roomRows, bookingRows] = await Promise.all([
      db.select().from(roomsTable),
      db.select().from(bookingsTable),
    ]);

    const rooms = roomRows as RoomRecord[];
    const bookings = bookingRows as BookingRecord[];
    const roomById = new Map(rooms.map((room) => [room.id, room]));
    const activeBookingByRoomId = this.buildActiveBookingMap(bookings, operationDay);

    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter((room) => this.resolveRoomStatus(room, activeBookingByRoomId.get(room.id) ?? null) === 'occupied').length;
    const availableRooms = rooms.filter((room) => this.resolveRoomStatus(room, activeBookingByRoomId.get(room.id) ?? null) === 'available').length;
    const cleaningRooms = rooms.filter((room) => this.resolveRoomStatus(room, activeBookingByRoomId.get(room.id) ?? null) === 'cleaning').length;
    const todayRevenue = this.getCollectedForDay(bookings, operationDay);
    const monthlyRevenue = this.getCollectedForMonth(bookings, operationDay.slice(0, 7));
    const outstandingPayments = this.getOutstandingPayments(bookings, roomById);
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    return dashboardSummarySchema.parse({
      operationDay,
      totalRooms,
      occupiedRooms,
      availableRooms,
      cleaningRooms,
      todayRevenue,
      monthlyRevenue,
      outstandingPayments,
      occupancyRate,
    });
  }

  async getTrends(query: unknown): Promise<DashboardTrends> {
    const operationDay = this.parseOperationDayQuery(query).operationDay ?? this.getCurrentOperationDay();

    const [roomRows, bookingRows] = await Promise.all([
      db.select().from(roomsTable),
      db.select().from(bookingsTable),
    ]);

    const rooms = roomRows as RoomRecord[];
    const bookings = bookingRows as BookingRecord[];

    const occupancySeries = Array.from({ length: 7 }, (_, index) => {
      const day = this.addDays(operationDay, index - 6);
      const occupiedCount = bookings.filter(
        (booking) => booking.status === 'confirmed' && this.isDateInsideStay(day, booking.checkInDate, booking.checkOutDate),
      ).length;

      return {
        label: this.toDayLabel(day),
        occupancyRate: rooms.length > 0 ? Math.round((occupiedCount / rooms.length) * 100) : 0,
      };
    });

    const revenueSeries = Array.from({ length: 7 }, (_, index) => {
      const day = this.addDays(operationDay, index - 6);
      const revenue = bookings
        .filter((booking) => booking.status !== 'cancelled' && this.toIsoDate(booking.createdAt) === day)
        .reduce((sum, booking) => sum + booking.paidAmount, 0);

      return {
        label: this.toDayLabel(day),
        revenue,
      };
    });

    return dashboardTrendsSchema.parse({
      operationDay,
      occupancySeries,
      revenueSeries,
    });
  }

  private parseOperationDayQuery(query: unknown): SummaryQuery {
    const record = this.toRecord(query);
    const operationDay = this.optionalIsoDate(record.operationDay);

    return {
      operationDay,
    };
  }

  private buildActiveBookingMap(bookings: BookingRecord[], operationDay: string): Map<string, BookingRecord> {
    const activeBookingByRoomId = new Map<string, BookingRecord>();

    for (const booking of bookings) {
      if (!this.isActiveBookingOn(operationDay, booking)) {
        continue;
      }

      activeBookingByRoomId.set(booking.roomId, booking);
    }

    return activeBookingByRoomId;
  }

  private resolveRoomStatus(room: RoomRecord, activeBooking: BookingRecord | null) {
    if (room.manualStatus === 'maintenance') {
      return 'maintenance';
    }

    if (activeBooking) {
      return 'occupied';
    }

    if (room.manualStatus === 'cleaning') {
      return 'cleaning';
    }

    return 'available';
  }

  private getCollectedForDay(bookings: BookingRecord[], dayIso: string): number {
    return bookings
      .filter((booking) => booking.status !== 'cancelled' && this.toIsoDate(booking.createdAt) === dayIso)
      .reduce((sum, booking) => sum + booking.paidAmount, 0);
  }

  private getCollectedForMonth(bookings: BookingRecord[], monthPrefix: string): number {
    return bookings
      .filter((booking) => booking.status !== 'cancelled' && this.toIsoDate(booking.createdAt).startsWith(monthPrefix))
      .reduce((sum, booking) => sum + booking.paidAmount, 0);
  }

  private getOutstandingPayments(bookings: BookingRecord[], roomById: Map<string, RoomRecord>): number {
    return bookings
      .filter((booking) => booking.status !== 'cancelled')
      .reduce((sum, booking) => {
        const room = roomById.get(booking.roomId);

        if (!room) {
          return sum;
        }

        const totalAmount = this.calculateTotalAmount(booking, room);
        const paidAmount = Math.min(booking.paidAmount ?? 0, totalAmount);
        return sum + Math.max(totalAmount - paidAmount, 0);
      }, 0);
  }

  private calculateTotalAmount(booking: BookingRecord, room: RoomRecord): number {
    const nights = this.calculateNights(booking.checkInDate, booking.checkOutDate);
    return room.pricePerNight * nights;
  }

  private calculateNights(checkInDate: string, checkOutDate: string): number {
    const start = this.parseIsoDate(checkInDate).getTime();
    const end = this.parseIsoDate(checkOutDate).getTime();
    const dayMs = 1000 * 60 * 60 * 24;
    return Math.round((end - start) / dayMs);
  }

  private isActiveBookingOn(operationDay: string, booking: BookingRecord): boolean {
    return booking.status !== 'cancelled' && booking.checkInDate <= operationDay && operationDay < booking.checkOutDate;
  }

  private isDateInsideStay(day: string, checkInDate: string, checkOutDate: string): boolean {
    return day >= checkInDate && day < checkOutDate;
  }

  private parseOperationDay(value: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException('operationDay must be in YYYY-MM-DD format.');
    }

    return value;
  }

  private optionalIsoDate(value: unknown): string | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('operationDay must be a string.');
    }

    return this.parseOperationDay(value);
  }

  private toRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, unknown>;
  }

  private parseIsoDate(value: string): Date {
    return new Date(`${value}T00:00:00Z`);
  }

  private toIsoDate(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private toDayLabel(isoDate: string): string {
    return this.parseIsoDate(isoDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  private addDays(day: string, days: number): string {
    const value = this.parseIsoDate(day);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
  }

  private getCurrentOperationDay(): string {
    return this.toIsoDate(new Date());
  }
}
