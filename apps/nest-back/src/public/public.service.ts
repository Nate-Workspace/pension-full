import { Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import {
  db,
  bookings as bookingsTable,
  rooms as roomsTable,
  siteAmenities,
  siteAttractions,
  siteConfig,
  siteFaqs,
  siteGalleryItems,
  sitePageContent,
} from '@repo/db';
import type {
  PublicPensionResponse,
  PublicRoomResponse,
  SiteConfigResponse,
  SiteContentResponse,
} from '@repo/contracts';
import { SettingsService } from '../settings/settings.service';
import {
  computeBookingStatus,
  type BookingLifecycleStatus,
} from '../bookings/booking-status';

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

    return {
      pensionName: this.pickText(site.pensionName, pensionInfo.pensionName),
      tagline: site.tagline,
      contactPhone: this.pickText(site.contactPhone, pensionInfo.contactPhone),
      contactEmail: this.pickText(site.contactEmail, pensionInfo.contactEmail),
      address: this.pickText(site.address, pensionInfo.address),
      city: this.pickText(site.city, pensionInfo.city),
      defaultCheckInTime: operational.defaultCheckInTime,
      defaultCheckOutTime: operational.defaultCheckOutTime,
    };
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

    return {
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
    };
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
      .filter((room) => room.manualStatus !== 'maintenance')
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
    const roomRows = (await db
      .select()
      .from(roomsTable)
      .where(eq(roomsTable.id, id))
      .limit(1)) as RoomRecord[];
    const room = roomRows[0];

    if (!room || room.manualStatus === 'maintenance') {
      throw new NotFoundException('Room not found');
    }

    const operationDay = this.getCurrentOperationDay();
    const bookingRows = (await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.roomId, id))) as BookingRecord[];
    const activeBooking =
      this.findActiveBookingForRoom(bookingRows, operationDay) ?? null;

    return this.toPublicRoom(room, activeBooking);
  }

  private toPublicRoom(
    room: RoomRecord,
    activeBooking: BookingRecord | null,
  ): PublicRoomResponse {
    const status = this.resolvePublicStatus(room.manualStatus, activeBooking);

    return {
      id: room.id,
      name: room.name,
      number: room.number,
      floor: room.floor,
      type: room.type,
      status,
      pricePerNight: room.pricePerNight,
      capacity: room.capacity,
    };
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
