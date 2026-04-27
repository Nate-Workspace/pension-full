import { BadRequestException, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db } from '@repo/db';

type ReportsQuery = {
  startDate?: string;
  endDate?: string;
};

type OccupancyPoint = {
  day: string;
  rate: number;
};

type RevenuePoint = {
  day: string;
  revenue: number;
};

type RoomTypeRevenuePoint = {
  roomType: string;
  revenue: number;
};

type MostBookedRoomPoint = {
  room: string;
  count: number;
};

type PeakDayPoint = {
  day: string;
  count: number;
};

type ReportsAnalyticsResponse = {
  startDate: string;
  endDate: string;
  occupancySeries: OccupancyPoint[];
  revenueSeries: RevenuePoint[];
  revenueByRoomType: RoomTypeRevenuePoint[];
  mostBookedRooms: MostBookedRoomPoint[];
  peakBookingDays: PeakDayPoint[];
  summaries: {
    averageOccupancy: number;
    totalRevenue: number;
    topRoom: MostBookedRoomPoint;
    peakDay: PeakDayPoint;
  };
};

const WEEK_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

@Injectable()
export class ReportsService {
  async getAnalytics(query: unknown): Promise<ReportsAnalyticsResponse> {
    const { startDate, endDate } = this.parseQuery(query);

    const roomCountPromise = db.execute(sql<{ count: string }>`
      SELECT COUNT(*)::text AS count
      FROM "rooms"
    `);

    const occupancyPromise = db.execute(sql<{ day: string; occupied_count: string }>`
      SELECT
        to_char(day, 'YYYY-MM-DD') AS day,
        COUNT(DISTINCT b."id")::text AS occupied_count
      FROM generate_series(${startDate}::date, ${endDate}::date, interval '1 day') AS day
      LEFT JOIN "bookings" b
        ON b."isCanceled" = false
       AND b."checkInDate"::date <= day::date
       AND b."checkOutDate"::date > day::date
      GROUP BY day
      ORDER BY day
    `);

    const revenueDailyPromise = db.execute(sql<{ day: string; revenue: string }>`
      SELECT
        to_char(day, 'YYYY-MM-DD') AS day,
        COALESCE(SUM(CASE WHEN b."id" IS NOT NULL THEN p."amount" ELSE 0 END), 0)::text AS revenue
      FROM generate_series(${startDate}::date, ${endDate}::date, interval '1 day') AS day
      LEFT JOIN "payments" p
        ON p."paidAt" IS NOT NULL
       AND p."paidAt"::date = day::date
      LEFT JOIN "bookings" b
        ON b."id" = p."bookingId"
       AND b."isCanceled" = false
      GROUP BY day
      ORDER BY day
    `);

    const revenueByTypePromise = db.execute(
      sql<{ room_type: string; revenue: string }>`
        SELECT
          r."type" AS room_type,
          COALESCE(SUM(p."amount"), 0)::text AS revenue
        FROM "rooms" r
        LEFT JOIN "bookings" b
          ON b."roomId" = r."id"
         AND b."isCanceled" = false
        LEFT JOIN "payments" p
          ON p."bookingId" = b."id"
         AND p."paidAt" IS NOT NULL
         AND p."paidAt"::date BETWEEN ${startDate}::date AND ${endDate}::date
        GROUP BY r."type"
      `,
    );

    const mostBookedRoomsPromise = db.execute(
      sql<{ room_number: string; count: string }>`
        SELECT
          r."number" AS room_number,
          COUNT(*)::text AS count
        FROM "bookings" b
        INNER JOIN "rooms" r
          ON r."id" = b."roomId"
        WHERE b."isCanceled" = false
          AND b."checkInDate"::date <= ${endDate}::date
          AND b."checkOutDate"::date > ${startDate}::date
        GROUP BY r."id", r."number"
        ORDER BY COUNT(*) DESC, r."number" ASC
        LIMIT 5
      `,
    );

    const peakDaysPromise = db.execute(sql<{ dow: string; count: string }>`
      SELECT
        EXTRACT(DOW FROM b."checkInDate"::date)::text AS dow,
        COUNT(*)::text AS count
      FROM "bookings" b
      WHERE b."isCanceled" = false
        AND b."checkInDate"::date BETWEEN ${startDate}::date AND ${endDate}::date
      GROUP BY EXTRACT(DOW FROM b."checkInDate"::date)
    `);

    const [
      roomCountResult,
      occupancyResult,
      revenueDailyResult,
      revenueByTypeResult,
      mostBookedRoomsResult,
      peakDaysResult,
    ] = await Promise.all([
      roomCountPromise,
      occupancyPromise,
      revenueDailyPromise,
      revenueByTypePromise,
      mostBookedRoomsPromise,
      peakDaysPromise,
    ]);

    const roomCountRows = this.getRows<{ count: string }>(roomCountResult);
    const occupancyRows = this.getRows<{ day: string; occupied_count: string }>(occupancyResult);
    const revenueDailyRows = this.getRows<{ day: string; revenue: string }>(revenueDailyResult);
    const revenueByTypeRows = this.getRows<{ room_type: string; revenue: string }>(revenueByTypeResult);
    const mostBookedRoomsRows = this.getRows<{ room_number: string; count: string }>(mostBookedRoomsResult);
    const peakDaysRows = this.getRows<{ dow: string; count: string }>(peakDaysResult);

    const totalRooms = this.toNumber(roomCountRows[0]?.count);

    const occupancySeries = occupancyRows.map((row) => ({
      day: this.shortDateLabel(String(row.day)),
      rate: totalRooms > 0 ? Math.round((this.toNumber(row.occupied_count) / totalRooms) * 100) : 0,
    }));

    const revenueSeries = revenueDailyRows.map((row) => ({
      day: this.shortDateLabel(String(row.day)),
      revenue: this.toNumber(row.revenue),
    }));

    const revenueByTypeTotals = new Map<string, number>(
      revenueByTypeRows.map((row) => [String(row.room_type), this.toNumber(row.revenue)]),
    );

    const revenueByRoomType: RoomTypeRevenuePoint[] = [
      { roomType: 'Single', revenue: revenueByTypeTotals.get('single') ?? 0 },
      { roomType: 'Double', revenue: revenueByTypeTotals.get('double') ?? 0 },
      { roomType: 'VIP', revenue: revenueByTypeTotals.get('vip') ?? 0 },
    ];

    const mostBookedRooms = mostBookedRoomsRows.map((row) => ({
      room: `Room ${String(row.room_number)}`,
      count: this.toNumber(row.count),
    }));

    const peakDayMap = new Map<number, number>(
      peakDaysRows.map((row) => [this.toNumber(row.dow), this.toNumber(row.count)]),
    );

    const peakBookingDays: PeakDayPoint[] = WEEK_DAY_LABELS.map((day, index) => ({
      day,
      count: peakDayMap.get(index) ?? 0,
    }));

    const averageOccupancy =
      occupancySeries.length > 0
        ? Math.round(
            occupancySeries.reduce((sum, item) => sum + item.rate, 0) /
              occupancySeries.length,
          )
        : 0;

    const totalRevenue = revenueByRoomType.reduce((sum, item) => sum + item.revenue, 0);

    const topRoom = mostBookedRooms[0] ?? { room: '-', count: 0 };
    const peakDay =
      peakBookingDays.reduce<PeakDayPoint>((top, item) =>
        item.count > top.count ? item : top,
      { day: '-', count: 0 }) ?? { day: '-', count: 0 };

    return {
      startDate,
      endDate,
      occupancySeries,
      revenueSeries,
      revenueByRoomType,
      mostBookedRooms,
      peakBookingDays,
      summaries: {
        averageOccupancy,
        totalRevenue,
        topRoom,
        peakDay,
      },
    };
  }

  private parseQuery(query: unknown): { startDate: string; endDate: string } {
    const record = this.toRecord(query);
    const startDate = this.parseIsoDate(record.startDate, 'startDate');
    const endDate = this.parseIsoDate(record.endDate, 'endDate');

    if (startDate > endDate) {
      throw new BadRequestException('endDate must be greater than or equal to startDate.');
    }

    return { startDate, endDate };
  }

  private parseIsoDate(value: unknown, field: string): string {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(`${field} must be in YYYY-MM-DD format.`);
    }

    return value;
  }

  private toRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, unknown>;
  }

  private getRows<T>(result: unknown): T[] {
    if (Array.isArray(result)) {
      return result as T[];
    }

    if (result && typeof result === 'object' && 'rows' in result) {
      return (result as { rows: T[] }).rows;
    }

    return [];
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  private shortDateLabel(isoDate: string): string {
    const value = new Date(`${isoDate}T00:00:00Z`);

    return value.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}
