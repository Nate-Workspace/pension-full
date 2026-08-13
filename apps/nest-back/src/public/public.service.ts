import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { asc, eq } from 'drizzle-orm';
import {
  db,
  bookings as bookingsTable,
  payments as paymentsTable,
  rooms as roomsTable,
  siteAmenities,
  siteAttractions,
  siteConfig,
  siteFaqs,
  siteGalleryItems,
  sitePageContent,
} from '@repo/db';
import type {
  PublicBookedRange,
  PublicBookingCheckoutInput,
  PublicBookingCheckoutResponse,
  PublicBookingLookupQueryInput,
  PublicBookingLookupResponse,
  PublicPensionResponse,
  PublicRoomAvailabilityQueryInput,
  PublicRoomAvailabilityResponse,
  PublicRoomResponse,
  SiteConfigResponse,
  SiteContentResponse,
} from '@repo/contracts';
import {
  publicBookingCheckoutResponseSchema,
  publicBookingCheckoutSchema,
  publicBookingLookupQuerySchema,
  publicBookingLookupResponseSchema,
  publicPensionResponseSchema,
  publicRoomAvailabilityQuerySchema,
  publicRoomResponseSchema,
  publicRoomAvailabilityResponseSchema,
  siteContentResponseSchema,
} from '@repo/contracts';
import { SettingsService } from '../settings/settings.service';
import {
  computeBookingStatus,
  type BookingLifecycleStatus,
} from '../bookings/booking-status';
import {
  assertPublicBookableRoom,
  assertPublicVisibleRoom,
  assertMinimumAdvanceBooking,
  isPublicBookableRoom,
} from './public-booking-rules';
import { contactMatchesBooking } from './public-contact';

type RoomRecord = typeof roomsTable.$inferSelect;
type BookingRecord = typeof bookingsTable.$inferSelect;
type SiteConfigRecord = typeof siteConfig.$inferSelect;
type PublicRoomStatus = PublicRoomResponse['status'];

const SITE_CONFIG_ID = 'main';
const SECTION_PAGE_SLUGS = ['home', 'rooms', 'about', 'contact'] as const;

@Injectable()
export class PublicService {
  constructor(private readonly settingsService: SettingsService) {}

  async getPension(): Promise<PublicPensionResponse> {
    const [site, operational] = await Promise.all([
      this.getOrCreateSiteConfig(),
      this.settingsService.getOperationalPreferences(),
    ]);
    const pensionInfo = await this.settingsService.getPensionInfo();

    return publicPensionResponseSchema.parse({
      pensionName: this.pickText(site.pensionName, pensionInfo.pensionName),
      tagline: site.tagline,
      contactPhone: this.pickText(site.contactPhone, pensionInfo.contactPhone),
      contactEmail: this.pickText(site.contactEmail, pensionInfo.contactEmail),
      address: this.pickText(site.address, pensionInfo.address),
      city: this.pickText(site.city, pensionInfo.city),
      defaultCheckInTime: operational.defaultCheckInTime,
      defaultCheckOutTime: operational.defaultCheckOutTime,
    });
  }

  async getSiteContent(): Promise<SiteContentResponse> {
    const [
      configRecord,
      pageRows,
      galleryRows,
      amenityRows,
      faqRows,
      attractionRows,
    ] = await Promise.all([
      this.getOrCreateSiteConfig(),
      db.select().from(sitePageContent).orderBy(asc(sitePageContent.sortOrder)),
      db
        .select()
        .from(siteGalleryItems)
        .orderBy(asc(siteGalleryItems.sortOrder)),
      db.select().from(siteAmenities).orderBy(asc(siteAmenities.sortOrder)),
      db.select().from(siteFaqs).orderBy(asc(siteFaqs.sortOrder)),
      db
        .select()
        .from(siteAttractions)
        .orderBy(asc(siteAttractions.sortOrder)),
    ]);

    const pages = Object.fromEntries(
      SECTION_PAGE_SLUGS.map((slug) => [
        slug,
        pageRows
          .filter((row) => row.pageSlug === slug)
          .map((row) => ({
            sectionKey: row.sectionKey,
            content: row.content,
            sortOrder: row.sortOrder,
          })),
      ]),
    );

    return siteContentResponseSchema.parse({
      config: this.toSiteConfigResponse(configRecord),
      pages,
      gallery: galleryRows.map((row) => ({
        id: row.id,
        imageUrl: row.imageUrl,
        caption: row.caption,
        sortOrder: row.sortOrder,
      })),
      amenities: amenityRows.map((row) => ({
        id: row.id,
        name: row.name,
        icon: row.icon,
        description: row.description,
        sortOrder: row.sortOrder,
      })),
      faqs: faqRows.map((row) => ({
        id: row.id,
        question: row.question,
        answer: row.answer,
        sortOrder: row.sortOrder,
      })),
      attractions: attractionRows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        distance: row.distance,
        imageUrl: row.imageUrl,
        sortOrder: row.sortOrder,
      })),
    });
  }

  async listRooms(): Promise<PublicRoomResponse[]> {
    const roomRows = (await db.select().from(roomsTable)) as RoomRecord[];
    const bookingRows = (await db.select().from(bookingsTable)) as BookingRecord[];
    const operationDay = this.getCurrentOperationDay();
    const activeBookingByRoomId = this.buildActiveBookingMap(
      bookingRows,
      operationDay,
    );

    return roomRows
      .filter((room) => isPublicBookableRoom(room))
      .map((room) =>
        this.toPublicRoom(room, activeBookingByRoomId.get(room.id) ?? null),
      )
      .sort((left, right) => {
        const floorDiff = left.floor - right.floor;
        if (floorDiff !== 0) {
          return floorDiff;
        }

        return left.number.localeCompare(right.number, undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      });
  }

  async getRoomById(id: string): Promise<PublicRoomResponse> {
    const room = await this.findPublicRoomById(id);
    assertPublicVisibleRoom(room);

    const operationDay = this.getCurrentOperationDay();
    const bookingRows = (await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.roomId, id))) as BookingRecord[];
    const activeBooking =
      this.findActiveBookingForRoom(bookingRows, operationDay) ?? null;

    return this.toPublicRoom(room, activeBooking);
  }

  async getRoomAvailability(
    id: string,
    query: unknown,
  ): Promise<PublicRoomAvailabilityResponse> {
    const parsedQuery = this.parseSchema<PublicRoomAvailabilityQueryInput>(
      publicRoomAvailabilityQuerySchema,
      query,
    );

    const room = await this.findPublicRoomById(id);
    assertPublicVisibleRoom(room);

    const operationDay = this.getCurrentOperationDay();
    const bookingRows = (await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.roomId, id))) as BookingRecord[];

    const bookedRanges = bookingRows
      .filter((booking) =>
        this.isBlockingBookingForAvailability(
          booking,
          operationDay,
          parsedQuery.from,
          parsedQuery.to,
        ),
      )
      .map((booking) =>
        this.toPublicBookedRange(
          booking,
          operationDay,
          parsedQuery.from,
          parsedQuery.to,
        ),
      )
      .filter((range) => range.checkInDate < range.checkOutDate)
      .sort((left, right) => left.checkInDate.localeCompare(right.checkInDate));

    return publicRoomAvailabilityResponseSchema.parse({
      roomId: room.id,
      bookedRanges,
    });
  }

  async requirePublicBookableRoom(id: string): Promise<RoomRecord> {
    const room = await this.findPublicRoomById(id);
    assertPublicBookableRoom(room);
    return room;
  }

  async assertPublicBookingDates(
    checkInDate: string,
    checkOutDate: string,
  ): Promise<void> {
    const siteConfigRecord = await this.getOrCreateSiteConfig();
    assertMinimumAdvanceBooking(checkInDate, checkOutDate, {
      sameDayBookingCutoffTime: siteConfigRecord.sameDayBookingCutoffTime,
    });
  }

  async checkoutBooking(body: unknown): Promise<PublicBookingCheckoutResponse> {
    const input = this.parseSchema<PublicBookingCheckoutInput>(
      publicBookingCheckoutSchema,
      body,
    );

    await this.assertOnlineBookingsAllowed();
    await this.assertPublicBookingDates(input.checkInDate, input.checkOutDate);

    const operational = await this.settingsService.getOperationalPreferences();
    const room = await this.requirePublicBookableRoom(input.roomId);

    await this.ensureNoOverlapInTransaction(db, {
      roomId: input.roomId,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
    });

    const nights = this.calculateNights(input.checkInDate, input.checkOutDate);
    const totalAmount = room.pricePerNight * nights;
    const bookingId = this.createBookingId();
    const code = await this.generateBookingCode(db);

    const insertedBookings = (await db
      .insert(bookingsTable)
      .values({
        id: bookingId,
        code,
        roomId: room.id,
        guestName: input.guestName,
        guestPhone: input.guestPhone ?? null,
        guestEmail: input.guestEmail ?? null,
        guestIdNumber: null,
        handledBy: null,
        isCanceled: false,
        checkedOutAt: null,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        paidAmount: totalAmount,
        source: 'website',
      })
      .returning()) as BookingRecord[];

    const booking = insertedBookings[0];

    if (!booking) {
      throw new BadRequestException('Failed to create booking.');
    }

    const paymentReference = this.createOnlinePaymentReference(code);
    const insertedPayments = await db
      .insert(paymentsTable)
      .values({
        id: this.createPaymentId(),
        bookingId: booking.id,
        roomId: room.id,
        amount: totalAmount,
        method: 'online',
        status: 'paid',
        paidAt: new Date(),
        reference: paymentReference,
      })
      .returning();

    if (!insertedPayments[0]) {
      throw new BadRequestException('Failed to record payment.');
    }

    const result = {
      code: booking.code,
      roomId: room.id,
      roomName: room.name,
      roomNumber: room.number,
      guestName: booking.guestName,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      nights,
      pricePerNight: room.pricePerNight,
      totalAmount,
      paidAmount: totalAmount,
      paymentStatus: 'paid' as const,
      defaultCheckInTime: operational.defaultCheckInTime,
      defaultCheckOutTime: operational.defaultCheckOutTime,
    };

    return publicBookingCheckoutResponseSchema.parse(result);
  }

  async lookupBooking(query: unknown): Promise<PublicBookingLookupResponse> {
    const input = this.parseSchema<PublicBookingLookupQueryInput>(
      publicBookingLookupQuerySchema,
      query,
    );

    const bookingRows = (await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.code, input.code))
      .limit(1)) as BookingRecord[];
    const booking = bookingRows[0];

    if (!booking || !contactMatchesBooking(input.contact, booking)) {
      throw new NotFoundException('Booking not found.');
    }

    const roomRows = (await db
      .select()
      .from(roomsTable)
      .where(eq(roomsTable.id, booking.roomId))
      .limit(1)) as RoomRecord[];
    const room = roomRows[0];

    if (!room) {
      throw new NotFoundException('Booking not found.');
    }

    const operational = await this.settingsService.getOperationalPreferences();
    const operationDay = this.getCurrentOperationDay();
    const nights = this.calculateNights(booking.checkInDate, booking.checkOutDate);
    const totalAmount = room.pricePerNight * nights;
    const paidAmount = Math.min(booking.paidAmount ?? 0, totalAmount);
    const status = computeBookingStatus(
      {
        isCanceled: booking.isCanceled,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        checkedOutAt: booking.checkedOutAt,
      },
      operationDay,
    );

    return publicBookingLookupResponseSchema.parse({
      code: booking.code,
      status,
      roomName: room.name,
      roomNumber: room.number,
      guestName: booking.guestName,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      nights,
      totalAmount,
      paidAmount,
      paymentStatus: this.derivePaymentStatus(totalAmount, paidAmount),
      defaultCheckInTime: operational.defaultCheckInTime,
      defaultCheckOutTime: operational.defaultCheckOutTime,
    });
  }

  private async findPublicRoomById(id: string): Promise<RoomRecord | undefined> {
    const roomRows = (await db
      .select()
      .from(roomsTable)
      .where(eq(roomsTable.id, id))
      .limit(1)) as RoomRecord[];

    return roomRows[0];
  }

  private toPublicRoom(
    room: RoomRecord,
    activeBooking: BookingRecord | null,
  ): PublicRoomResponse {
    const status = this.resolvePublicStatus(room.manualStatus, activeBooking);

    return publicRoomResponseSchema.parse({
      id: room.id,
      name: room.name,
      number: room.number,
      floor: room.floor,
      type: room.type,
      status,
      pricePerNight: room.pricePerNight,
      capacity: room.capacity,
    });
  }

  private resolvePublicStatus(
    manualStatus: RoomRecord['manualStatus'],
    activeBooking: BookingRecord | null,
  ): PublicRoomStatus {
    if (activeBooking) {
      return 'occupied';
    }

    if (manualStatus === 'cleaning') {
      return 'cleaning';
    }

    return 'available';
  }

  private buildActiveBookingMap(
    bookings: BookingRecord[],
    operationDay: string,
  ): Map<string, BookingRecord> {
    const map = new Map<string, BookingRecord>();

    for (const booking of bookings) {
      const status = this.getBookingStatus(booking, operationDay);
      if (status !== 'active') {
        continue;
      }

      map.set(booking.roomId, booking);
    }

    return map;
  }

  private findActiveBookingForRoom(
    bookings: BookingRecord[],
    operationDay: string,
  ): BookingRecord | undefined {
    return bookings.find(
      (booking) => this.getBookingStatus(booking, operationDay) === 'active',
    );
  }

  private getBookingStatus(
    booking: BookingRecord,
    operationDay: string,
  ): BookingLifecycleStatus {
    return computeBookingStatus(
      {
        isCanceled: booking.isCanceled,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        checkedOutAt: booking.checkedOutAt,
      },
      operationDay,
    );
  }

  private getCurrentOperationDay(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private async assertOnlineBookingsAllowed(): Promise<void> {
    const siteConfigRecord = await this.getOrCreateSiteConfig();

    if (siteConfigRecord.allowOnlineBookings !== 1) {
      throw new BadRequestException('Online bookings are currently unavailable.');
    }
  }

  private async ensureNoOverlapInTransaction(
    tx: Pick<typeof db, 'select'>,
    input: {
      roomId: string;
      checkInDate: string;
      checkOutDate: string;
    },
  ): Promise<void> {
    const roomBookings = (await tx
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.roomId, input.roomId))) as BookingRecord[];
    const operationDay = this.getCurrentOperationDay();

    const hasConflict = roomBookings.some((booking) => {
      if (booking.isCanceled || booking.checkedOutAt) {
        return false;
      }

      const status = computeBookingStatus(
        {
          isCanceled: booking.isCanceled,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          checkedOutAt: booking.checkedOutAt,
        },
        operationDay,
      );

      if (status === 'canceled' || status === 'checked_out') {
        return false;
      }

      return (
        input.checkInDate < booking.checkOutDate &&
        input.checkOutDate > booking.checkInDate
      );
    });

    if (hasConflict) {
      throw new ConflictException(
        'This room is not available for the selected dates.',
      );
    }
  }

  private calculateNights(checkInDate: string, checkOutDate: string): number {
    const start = this.parseIsoDate(checkInDate).getTime();
    const end = this.parseIsoDate(checkOutDate).getTime();
    const dayMs = 1000 * 60 * 60 * 24;

    return Math.round((end - start) / dayMs);
  }

  private parseIsoDate(value: string): Date {
    return new Date(`${value}T00:00:00Z`);
  }

  private async generateBookingCode(
    tx: Pick<typeof db, 'select'>,
  ): Promise<string> {
    const bookingRows = (await tx
      .select({ id: bookingsTable.id })
      .from(bookingsTable)) as Array<{ id: string }>;

    let candidateIndex = bookingRows.length + 1;

    while (true) {
      const candidate = this.createBookingCode(candidateIndex);
      const existing = (await tx
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

  private createPaymentId(): string {
    return `pay-${randomUUID().slice(0, 8)}`;
  }

  private createOnlinePaymentReference(code: string): string {
    return `ONLINE-${code}`;
  }

  private derivePaymentStatus(
    totalAmount: number,
    paidAmount: number,
  ): PublicBookingLookupResponse['paymentStatus'] {
    if (paidAmount <= 0) {
      return 'unpaid';
    }

    if (paidAmount >= totalAmount) {
      return 'paid';
    }

    return 'partial';
  }

  private isBlockingBookingForAvailability(
    booking: BookingRecord,
    operationDay: string,
    from: string,
    to: string,
  ): boolean {
    if (booking.isCanceled || booking.checkedOutAt) {
      return false;
    }

    if (booking.checkOutDate <= operationDay) {
      return false;
    }

    return booking.checkInDate < to && booking.checkOutDate > from;
  }

  private toPublicBookedRange(
    booking: BookingRecord,
    operationDay: string,
    from: string,
    to: string,
  ): PublicBookedRange {
    const checkInDate =
      booking.checkInDate > from ? booking.checkInDate : from;
    const futureCheckIn =
      checkInDate > operationDay ? checkInDate : operationDay;
    const checkOutDate =
      booking.checkOutDate < to ? booking.checkOutDate : to;

    return {
      checkInDate: futureCheckIn,
      checkOutDate,
    };
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

  private pickText(primary: string, fallback: string): string {
    const trimmed = primary.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  private toSiteConfigResponse(record: SiteConfigRecord): SiteConfigResponse {
    return {
      pensionName: record.pensionName,
      tagline: record.tagline,
      heroImageUrl: record.heroImageUrl,
      heroHeadline: record.heroHeadline,
      heroSubtext: record.heroSubtext,
      aboutDescription: record.aboutDescription,
      cancellationPolicy: record.cancellationPolicy,
      termsText: record.termsText,
      privacyText: record.privacyText,
      mapEmbedUrl: record.mapEmbedUrl,
      mapLat: record.mapLat,
      mapLng: record.mapLng,
      allowOnlineBookings: record.allowOnlineBookings === 1,
      sameDayBookingCutoffTime: record.sameDayBookingCutoffTime,
      contactPhone: record.contactPhone,
      contactEmail: record.contactEmail,
      address: record.address,
      city: record.city,
    };
  }

  private async getOrCreateSiteConfig(): Promise<SiteConfigRecord> {
    const existingRows = await db
      .select()
      .from(siteConfig)
      .where(eq(siteConfig.id, SITE_CONFIG_ID))
      .limit(1);
    const existing = existingRows[0];

    if (existing) {
      return existing;
    }

    const insertedRows = await db
      .insert(siteConfig)
      .values({ id: SITE_CONFIG_ID })
      .returning();
    const inserted = insertedRows[0];

    if (!inserted) {
      throw new NotFoundException('Unable to initialize site config.');
    }

    return inserted;
  }
}
