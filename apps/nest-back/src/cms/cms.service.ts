import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import {
  cmsAmenityInputSchema,
  cmsAmenityUpdateSchema,
  cmsAttractionInputSchema,
  cmsAttractionUpdateSchema,
  cmsDeleteResponseSchema,
  cmsFaqInputSchema,
  cmsFaqUpdateSchema,
  cmsGalleryItemInputSchema,
  cmsGalleryItemUpdateSchema,
  cmsGlobalUpdateSchema,
  cmsPageContentUpdateSchema,
  cmsPageSlugSchema,
  type CmsPageContentResponse,
  type CmsPageSlug,
  type CmsPageSummary,
  type SiteConfigResponse,
} from '@repo/contracts';
import {
  db,
  siteAmenities,
  siteAttractions,
  siteConfig,
  siteFaqs,
  siteGalleryItems,
  sitePageContent,
} from '@repo/db';

type SiteConfigRecord = typeof siteConfig.$inferSelect;

const SITE_CONFIG_ID = 'main';

const CMS_PAGE_DEFINITIONS: Array<{
  slug: CmsPageSlug;
  title: string;
  kind: 'sections' | 'gallery' | 'amenities' | 'faqs' | 'attractions';
}> = [
  { slug: 'home', title: 'Home', kind: 'sections' },
  { slug: 'rooms', title: 'Rooms', kind: 'sections' },
  { slug: 'about', title: 'About', kind: 'sections' },
  { slug: 'contact', title: 'Contact', kind: 'sections' },
  { slug: 'gallery', title: 'Gallery', kind: 'gallery' },
  { slug: 'amenities', title: 'Amenities', kind: 'amenities' },
  { slug: 'attractions', title: 'Attractions', kind: 'attractions' },
  { slug: 'faq', title: 'FAQ', kind: 'faqs' },
];

@Injectable()
export class CmsService {
  async listPages(): Promise<CmsPageSummary[]> {
    const [
      pageRows,
      galleryRows,
      amenityRows,
      faqRows,
      attractionRows,
    ] = await Promise.all([
      db.select().from(sitePageContent),
      db.select().from(siteGalleryItems),
      db.select().from(siteAmenities),
      db.select().from(siteFaqs),
      db.select().from(siteAttractions),
    ]);

    return CMS_PAGE_DEFINITIONS.map((page) => ({
      slug: page.slug,
      title: page.title,
      isComplete: this.isPageComplete(page, {
        pageRows,
        galleryRows,
        amenityRows,
        faqRows,
        attractionRows,
      }),
    }));
  }

  async getPageContent(slug: string): Promise<CmsPageContentResponse> {
    const parsedSlug = this.parsePageSlug(slug);
    const page = this.getPageDefinition(parsedSlug);

    if (page.kind === 'sections') {
      const sections = await db
        .select()
        .from(sitePageContent)
        .where(eq(sitePageContent.pageSlug, parsedSlug))
        .orderBy(asc(sitePageContent.sortOrder));

      return {
        slug: parsedSlug,
        title: page.title,
        sections: sections.map((row) => ({
          sectionKey: row.sectionKey,
          content: row.content,
          sortOrder: row.sortOrder,
        })),
      };
    }

    if (page.kind === 'gallery') {
      const gallery = await db
        .select()
        .from(siteGalleryItems)
        .orderBy(asc(siteGalleryItems.sortOrder));

      return {
        slug: parsedSlug,
        title: page.title,
        gallery: gallery.map((row) => ({
          id: row.id,
          imageUrl: row.imageUrl,
          caption: row.caption,
          sortOrder: row.sortOrder,
        })),
      };
    }

    if (page.kind === 'amenities') {
      const amenities = await db
        .select()
        .from(siteAmenities)
        .orderBy(asc(siteAmenities.sortOrder));

      return {
        slug: parsedSlug,
        title: page.title,
        amenities: amenities.map((row) => ({
          id: row.id,
          name: row.name,
          icon: row.icon,
          description: row.description,
          sortOrder: row.sortOrder,
        })),
      };
    }

    if (page.kind === 'faqs') {
      const faqs = await db
        .select()
        .from(siteFaqs)
        .orderBy(asc(siteFaqs.sortOrder));

      return {
        slug: parsedSlug,
        title: page.title,
        faqs: faqs.map((row) => ({
          id: row.id,
          question: row.question,
          answer: row.answer,
          sortOrder: row.sortOrder,
        })),
      };
    }

    const attractions = await db
      .select()
      .from(siteAttractions)
      .orderBy(asc(siteAttractions.sortOrder));

    return {
      slug: parsedSlug,
      title: page.title,
      attractions: attractions.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        distance: row.distance,
        imageUrl: row.imageUrl,
        sortOrder: row.sortOrder,
      })),
    };
  }

  async updatePageContent(slug: string, body: unknown): Promise<CmsPageContentResponse> {
    const parsedSlug = this.parsePageSlug(slug);
    const page = this.getPageDefinition(parsedSlug);

    if (page.kind !== 'sections') {
      throw new BadRequestException(
        'Use the dedicated CMS entity routes for this page.',
      );
    }

    const parsedInput = cmsPageContentUpdateSchema.parse(body);

    if (!parsedInput.sections) {
      throw new BadRequestException('sections are required.');
    }

    await db
      .delete(sitePageContent)
      .where(eq(sitePageContent.pageSlug, parsedSlug));

    if (parsedInput.sections.length > 0) {
      await db.insert(sitePageContent).values(
        parsedInput.sections.map((section) => ({
          pageSlug: parsedSlug,
          sectionKey: section.sectionKey,
          content: section.content,
          sortOrder: section.sortOrder,
        })),
      );
    }

    return this.getPageContent(parsedSlug);
  }

  async getGlobalConfig(): Promise<SiteConfigResponse> {
    const record = await this.getOrCreateSiteConfig();
    return this.toSiteConfigResponse(record);
  }

  async updateGlobalConfig(body: unknown): Promise<SiteConfigResponse> {
    const input = cmsGlobalUpdateSchema.parse(body);
    const current = await this.getOrCreateSiteConfig();

    const updatedRows = await db
      .update(siteConfig)
      .set({
        pensionName: input.pensionName ?? current.pensionName,
        tagline: input.tagline ?? current.tagline,
        heroImageUrl: input.heroImageUrl ?? current.heroImageUrl,
        heroHeadline: input.heroHeadline ?? current.heroHeadline,
        heroSubtext: input.heroSubtext ?? current.heroSubtext,
        aboutDescription: input.aboutDescription ?? current.aboutDescription,
        cancellationPolicy:
          input.cancellationPolicy ?? current.cancellationPolicy,
        termsText: input.termsText ?? current.termsText,
        privacyText: input.privacyText ?? current.privacyText,
        mapEmbedUrl: input.mapEmbedUrl ?? current.mapEmbedUrl,
        mapLat: input.mapLat ?? current.mapLat,
        mapLng: input.mapLng ?? current.mapLng,
        allowOnlineBookings:
          input.allowOnlineBookings === undefined
            ? current.allowOnlineBookings
            : input.allowOnlineBookings
              ? 1
              : 0,
        sameDayBookingCutoffTime:
          input.sameDayBookingCutoffTime ?? current.sameDayBookingCutoffTime,
        contactPhone: input.contactPhone ?? current.contactPhone,
        contactEmail: input.contactEmail ?? current.contactEmail,
        address: input.address ?? current.address,
        city: input.city ?? current.city,
        updatedAt: new Date(),
      })
      .where(eq(siteConfig.id, SITE_CONFIG_ID))
      .returning();

    const updated = updatedRows[0];

    if (!updated) {
      throw new BadRequestException('Unable to update site config.');
    }

    return this.toSiteConfigResponse(updated);
  }

  listGalleryItems() {
    return db
      .select()
      .from(siteGalleryItems)
      .orderBy(asc(siteGalleryItems.sortOrder));
  }

  async createGalleryItem(body: unknown) {
    const input = cmsGalleryItemInputSchema.parse(body);

    const insertedRows = await db
      .insert(siteGalleryItems)
      .values({
        id: randomUUID(),
        imageUrl: input.imageUrl,
        caption: input.caption ?? '',
        sortOrder: input.sortOrder ?? 0,
      })
      .returning();

    return insertedRows[0];
  }

  async updateGalleryItem(id: string, body: unknown) {
    const input = cmsGalleryItemUpdateSchema.parse(body);
    const existingRows = await db
      .select()
      .from(siteGalleryItems)
      .where(eq(siteGalleryItems.id, id))
      .limit(1);
    const existing = existingRows[0];

    if (!existing) {
      throw new NotFoundException('Gallery item not found.');
    }

    const updatedRows = await db
      .update(siteGalleryItems)
      .set({
        imageUrl: input.imageUrl ?? existing.imageUrl,
        caption: input.caption ?? existing.caption,
        sortOrder: input.sortOrder ?? existing.sortOrder,
      })
      .where(eq(siteGalleryItems.id, id))
      .returning();

    const updated = updatedRows[0];

    if (!updated) {
      throw new NotFoundException('Gallery item not found.');
    }

    return updated;
  }

  async deleteGalleryItem(id: string) {
    const deletedRows = await db
      .delete(siteGalleryItems)
      .where(eq(siteGalleryItems.id, id))
      .returning();

    if (!deletedRows[0]) {
      throw new NotFoundException('Gallery item not found.');
    }

    return cmsDeleteResponseSchema.parse({ message: 'Gallery item deleted.' });
  }

  listAmenities() {
    return db.select().from(siteAmenities).orderBy(asc(siteAmenities.sortOrder));
  }

  async createAmenity(body: unknown) {
    const input = cmsAmenityInputSchema.parse(body);

    const insertedRows = await db
      .insert(siteAmenities)
      .values({
        id: randomUUID(),
        name: input.name,
        icon: input.icon ?? '',
        description: input.description ?? '',
        sortOrder: input.sortOrder ?? 0,
      })
      .returning();

    return insertedRows[0];
  }

  async updateAmenity(id: string, body: unknown) {
    const input = cmsAmenityUpdateSchema.parse(body);
    const existingRows = await db
      .select()
      .from(siteAmenities)
      .where(eq(siteAmenities.id, id))
      .limit(1);
    const existing = existingRows[0];

    if (!existing) {
      throw new NotFoundException('Amenity not found.');
    }

    const updatedRows = await db
      .update(siteAmenities)
      .set({
        name: input.name ?? existing.name,
        icon: input.icon ?? existing.icon,
        description: input.description ?? existing.description,
        sortOrder: input.sortOrder ?? existing.sortOrder,
      })
      .where(eq(siteAmenities.id, id))
      .returning();

    const updated = updatedRows[0];

    if (!updated) {
      throw new NotFoundException('Amenity not found.');
    }

    return updated;
  }

  async deleteAmenity(id: string) {
    const deletedRows = await db
      .delete(siteAmenities)
      .where(eq(siteAmenities.id, id))
      .returning();

    if (!deletedRows[0]) {
      throw new NotFoundException('Amenity not found.');
    }

    return cmsDeleteResponseSchema.parse({ message: 'Amenity deleted.' });
  }

  listFaqs() {
    return db.select().from(siteFaqs).orderBy(asc(siteFaqs.sortOrder));
  }

  async createFaq(body: unknown) {
    const input = cmsFaqInputSchema.parse(body);

    const insertedRows = await db
      .insert(siteFaqs)
      .values({
        id: randomUUID(),
        question: input.question,
        answer: input.answer,
        sortOrder: input.sortOrder ?? 0,
      })
      .returning();

    return insertedRows[0];
  }

  async updateFaq(id: string, body: unknown) {
    const input = cmsFaqUpdateSchema.parse(body);
    const existingRows = await db
      .select()
      .from(siteFaqs)
      .where(eq(siteFaqs.id, id))
      .limit(1);
    const existing = existingRows[0];

    if (!existing) {
      throw new NotFoundException('FAQ not found.');
    }

    const updatedRows = await db
      .update(siteFaqs)
      .set({
        question: input.question ?? existing.question,
        answer: input.answer ?? existing.answer,
        sortOrder: input.sortOrder ?? existing.sortOrder,
      })
      .where(eq(siteFaqs.id, id))
      .returning();

    const updated = updatedRows[0];

    if (!updated) {
      throw new NotFoundException('FAQ not found.');
    }

    return updated;
  }

  async deleteFaq(id: string) {
    const deletedRows = await db
      .delete(siteFaqs)
      .where(eq(siteFaqs.id, id))
      .returning();

    if (!deletedRows[0]) {
      throw new NotFoundException('FAQ not found.');
    }

    return cmsDeleteResponseSchema.parse({ message: 'FAQ deleted.' });
  }

  listAttractions() {
    return db
      .select()
      .from(siteAttractions)
      .orderBy(asc(siteAttractions.sortOrder));
  }

  async createAttraction(body: unknown) {
    const input = cmsAttractionInputSchema.parse(body);

    const insertedRows = await db
      .insert(siteAttractions)
      .values({
        id: randomUUID(),
        name: input.name,
        description: input.description ?? '',
        distance: input.distance ?? '',
        imageUrl: input.imageUrl ?? '',
        sortOrder: input.sortOrder ?? 0,
      })
      .returning();

    return insertedRows[0];
  }

  async updateAttraction(id: string, body: unknown) {
    const input = cmsAttractionUpdateSchema.parse(body);
    const existingRows = await db
      .select()
      .from(siteAttractions)
      .where(eq(siteAttractions.id, id))
      .limit(1);
    const existing = existingRows[0];

    if (!existing) {
      throw new NotFoundException('Attraction not found.');
    }

    const updatedRows = await db
      .update(siteAttractions)
      .set({
        name: input.name ?? existing.name,
        description: input.description ?? existing.description,
        distance: input.distance ?? existing.distance,
        imageUrl: input.imageUrl ?? existing.imageUrl,
        sortOrder: input.sortOrder ?? existing.sortOrder,
      })
      .where(eq(siteAttractions.id, id))
      .returning();

    const updated = updatedRows[0];

    if (!updated) {
      throw new NotFoundException('Attraction not found.');
    }

    return updated;
  }

  async deleteAttraction(id: string) {
    const deletedRows = await db
      .delete(siteAttractions)
      .where(eq(siteAttractions.id, id))
      .returning();

    if (!deletedRows[0]) {
      throw new NotFoundException('Attraction not found.');
    }

    return cmsDeleteResponseSchema.parse({ message: 'Attraction deleted.' });
  }

  private parsePageSlug(slug: string): CmsPageSlug {
    const parsed = cmsPageSlugSchema.safeParse(slug);

    if (!parsed.success) {
      throw new NotFoundException('CMS page not found.');
    }

    return parsed.data;
  }

  private getPageDefinition(slug: CmsPageSlug) {
    const page = CMS_PAGE_DEFINITIONS.find((entry) => entry.slug === slug);

    if (!page) {
      throw new NotFoundException('CMS page not found.');
    }

    return page;
  }

  private isPageComplete(
    page: (typeof CMS_PAGE_DEFINITIONS)[number],
    data: {
      pageRows: Array<typeof sitePageContent.$inferSelect>;
      galleryRows: Array<typeof siteGalleryItems.$inferSelect>;
      amenityRows: Array<typeof siteAmenities.$inferSelect>;
      faqRows: Array<typeof siteFaqs.$inferSelect>;
      attractionRows: Array<typeof siteAttractions.$inferSelect>;
    },
  ): boolean {
    switch (page.kind) {
      case 'sections':
        return data.pageRows.some(
          (row) => row.pageSlug === page.slug && row.content.trim().length > 0,
        );
      case 'gallery':
        return data.galleryRows.length > 0;
      case 'amenities':
        return data.amenityRows.length > 0;
      case 'faqs':
        return data.faqRows.length > 0;
      case 'attractions':
        return data.attractionRows.length > 0;
      default:
        return false;
    }
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
      throw new BadRequestException('Unable to initialize site config.');
    }

    return inserted;
  }
}
