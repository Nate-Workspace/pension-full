import { z } from "zod";
import { roomTypeSchema } from "./rooms";
import { siteConfigResponseSchema, siteContentResponseSchema } from "./site-content";

export const publicPensionResponseSchema = z.object({
	pensionName: z.string(),
	tagline: z.string(),
	contactPhone: z.string(),
	contactEmail: z.string(),
	address: z.string(),
	city: z.string(),
	defaultCheckInTime: z.string(),
	defaultCheckOutTime: z.string(),
});

export const publicRoomStatusSchema = z.enum([
	"available",
	"occupied",
	"cleaning",
]);

export const publicRoomResponseSchema = z.object({
	id: z.string(),
	name: z.string(),
	number: z.string(),
	floor: z.number(),
	type: roomTypeSchema,
	status: publicRoomStatusSchema,
	pricePerNight: z.number(),
	capacity: z.number(),
});

export const publicRoomsResponseSchema = z.array(publicRoomResponseSchema);

export type PublicPensionResponse = z.infer<typeof publicPensionResponseSchema>;
export type PublicRoomResponse = z.infer<typeof publicRoomResponseSchema>;
export type PublicRoomsResponse = z.infer<typeof publicRoomsResponseSchema>;
export type { SiteConfigResponse, SiteContentResponse } from "./site-content";
export { siteConfigResponseSchema, siteContentResponseSchema };
