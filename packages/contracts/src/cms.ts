import { z } from "zod";
import {
	siteAmenitySchema,
	siteAttractionSchema,
	siteConfigResponseSchema,
	siteFaqSchema,
	siteGalleryItemSchema,
	sitePageSectionInputSchema,
	sitePageSectionSchema,
} from "./site-content";

export const cmsPageSlugSchema = z.enum([
	"home",
	"rooms",
	"about",
	"contact",
	"gallery",
	"amenities",
	"attractions",
	"faq",
]);

export const cmsPageSummarySchema = z.object({
	slug: cmsPageSlugSchema,
	title: z.string(),
	isComplete: z.boolean(),
});

export const cmsPagesResponseSchema = z.array(cmsPageSummarySchema);

export const cmsPageContentResponseSchema = z.object({
	slug: cmsPageSlugSchema,
	title: z.string(),
	sections: z.array(sitePageSectionSchema).optional(),
	gallery: z.array(siteGalleryItemSchema).optional(),
	amenities: z.array(siteAmenitySchema).optional(),
	faqs: z.array(siteFaqSchema).optional(),
	attractions: z.array(siteAttractionSchema).optional(),
});

export const cmsPageContentUpdateSchema = z.object({
	sections: z.array(sitePageSectionInputSchema).optional(),
});

export const cmsGalleryItemInputSchema = z.object({
	imageUrl: z.string().trim().min(1),
	caption: z.string().optional(),
	sortOrder: z.number().int().nonnegative().optional(),
});

export const cmsAmenityInputSchema = z.object({
	name: z.string().trim().min(1),
	icon: z.string().optional(),
	description: z.string().optional(),
	sortOrder: z.number().int().nonnegative().optional(),
});

export const cmsFaqInputSchema = z.object({
	question: z.string().trim().min(1),
	answer: z.string().trim().min(1),
	sortOrder: z.number().int().nonnegative().optional(),
});

export const cmsAttractionInputSchema = z.object({
	name: z.string().trim().min(1),
	description: z.string().optional(),
	distance: z.string().optional(),
	imageUrl: z.string().optional(),
	sortOrder: z.number().int().nonnegative().optional(),
});

export const cmsGlobalConfigResponseSchema = siteConfigResponseSchema;
export const cmsGlobalUpdateSchema = siteConfigResponseSchema.partial();

export const cmsGalleryItemUpdateSchema = cmsGalleryItemInputSchema.partial();
export const cmsAmenityUpdateSchema = cmsAmenityInputSchema.partial();
export const cmsFaqUpdateSchema = cmsFaqInputSchema.partial();
export const cmsAttractionUpdateSchema = cmsAttractionInputSchema.partial();

export const cmsDeleteResponseSchema = z.object({
	message: z.string(),
});

export const cmsEntityIdSchema = z.string().trim().min(1);

export const cmsSchemas = {
	pageSlug: cmsPageSlugSchema,
	pagesResponse: cmsPagesResponseSchema,
	pageContentResponse: cmsPageContentResponseSchema,
	pageContentUpdate: cmsPageContentUpdateSchema,
	globalConfigResponse: cmsGlobalConfigResponseSchema,
	globalUpdate: cmsGlobalUpdateSchema,
	galleryItemInput: cmsGalleryItemInputSchema,
	galleryItemUpdate: cmsGalleryItemUpdateSchema,
	amenityInput: cmsAmenityInputSchema,
	amenityUpdate: cmsAmenityUpdateSchema,
	faqInput: cmsFaqInputSchema,
	faqUpdate: cmsFaqUpdateSchema,
	attractionInput: cmsAttractionInputSchema,
	attractionUpdate: cmsAttractionUpdateSchema,
	deleteResponse: cmsDeleteResponseSchema,
	entityId: cmsEntityIdSchema,
} as const;

export type CmsPageSlug = z.infer<typeof cmsPageSlugSchema>;
export type CmsPageSummary = z.infer<typeof cmsPageSummarySchema>;
export type CmsPagesResponse = z.infer<typeof cmsPagesResponseSchema>;
export type CmsPageContentResponse = z.infer<typeof cmsPageContentResponseSchema>;
export type CmsPageContentUpdateInput = z.infer<typeof cmsPageContentUpdateSchema>;
export type CmsGlobalConfigResponse = z.infer<typeof cmsGlobalConfigResponseSchema>;
export type CmsGlobalUpdateInput = z.infer<typeof cmsGlobalUpdateSchema>;
export type CmsGalleryItemInput = z.infer<typeof cmsGalleryItemInputSchema>;
export type CmsGalleryItemUpdateInput = z.infer<typeof cmsGalleryItemUpdateSchema>;
export type CmsAmenityInput = z.infer<typeof cmsAmenityInputSchema>;
export type CmsAmenityUpdateInput = z.infer<typeof cmsAmenityUpdateSchema>;
export type CmsFaqInput = z.infer<typeof cmsFaqInputSchema>;
export type CmsFaqUpdateInput = z.infer<typeof cmsFaqUpdateSchema>;
export type CmsAttractionInput = z.infer<typeof cmsAttractionInputSchema>;
export type CmsAttractionUpdateInput = z.infer<typeof cmsAttractionUpdateSchema>;
export type CmsDeleteResponse = z.infer<typeof cmsDeleteResponseSchema>;
