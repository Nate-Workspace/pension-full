import { z } from "zod";

export const timeOfDaySchema = z
	.string()
	.regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:mm format.");

export const siteSectionPageSlugSchema = z.enum([
	"home",
	"rooms",
	"about",
	"contact",
]);

export const sitePageSectionInputSchema = z.object({
	sectionKey: z.string().trim().min(1),
	content: z.string(),
	sortOrder: z.number().int().nonnegative(),
});

export const sitePageSectionSchema = z.object({
	sectionKey: z.string(),
	content: z.string(),
	sortOrder: z.number(),
});

export const siteGalleryItemSchema = z.object({
	id: z.string(),
	imageUrl: z.string(),
	caption: z.string(),
	sortOrder: z.number(),
});

export const siteAmenitySchema = z.object({
	id: z.string(),
	name: z.string(),
	icon: z.string(),
	description: z.string(),
	sortOrder: z.number(),
});

export const siteFaqSchema = z.object({
	id: z.string(),
	question: z.string(),
	answer: z.string(),
	sortOrder: z.number(),
});

export const siteAttractionSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	distance: z.string(),
	imageUrl: z.string(),
	sortOrder: z.number(),
});

export const siteConfigResponseSchema = z.object({
	pensionName: z.string(),
	tagline: z.string(),
	heroImageUrl: z.string(),
	heroHeadline: z.string(),
	heroSubtext: z.string(),
	aboutDescription: z.string(),
	cancellationPolicy: z.string(),
	termsText: z.string(),
	privacyText: z.string(),
	mapEmbedUrl: z.string(),
	mapLat: z.string(),
	mapLng: z.string(),
	allowOnlineBookings: z.boolean(),
	sameDayBookingCutoffTime: timeOfDaySchema,
	contactPhone: z.string(),
	contactEmail: z.string(),
	address: z.string(),
	city: z.string(),
});

export const siteContentResponseSchema = z.object({
	config: siteConfigResponseSchema,
	pages: z.record(siteSectionPageSlugSchema, z.array(sitePageSectionSchema)),
	gallery: z.array(siteGalleryItemSchema),
	amenities: z.array(siteAmenitySchema),
	faqs: z.array(siteFaqSchema),
	attractions: z.array(siteAttractionSchema),
});

export const siteContentSchemas = {
	sectionPageSlug: siteSectionPageSlugSchema,
	pageSection: sitePageSectionSchema,
	pageSectionInput: sitePageSectionInputSchema,
	config: siteConfigResponseSchema,
	content: siteContentResponseSchema,
	galleryItem: siteGalleryItemSchema,
	amenity: siteAmenitySchema,
	faq: siteFaqSchema,
	attraction: siteAttractionSchema,
	timeOfDay: timeOfDaySchema,
} as const;

export type SiteSectionPageSlug = z.infer<typeof siteSectionPageSlugSchema>;
export type SitePageSectionInput = z.infer<typeof sitePageSectionInputSchema>;
export type SitePageSection = z.infer<typeof sitePageSectionSchema>;
export type SiteGalleryItem = z.infer<typeof siteGalleryItemSchema>;
export type SiteAmenity = z.infer<typeof siteAmenitySchema>;
export type SiteFaq = z.infer<typeof siteFaqSchema>;
export type SiteAttraction = z.infer<typeof siteAttractionSchema>;
export type SiteConfigResponse = z.infer<typeof siteConfigResponseSchema>;
export type SiteContentResponse = z.infer<typeof siteContentResponseSchema>;
