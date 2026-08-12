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

const publicDateSchema = z.iso.date();

export const publicRoomAvailabilityQuerySchema = z
	.object({
		from: publicDateSchema,
		to: publicDateSchema,
	})
	.refine((value) => value.to > value.from, {
		message: "to must be after from.",
		path: ["to"],
	});

export const publicBookedRangeSchema = z.object({
	checkInDate: publicDateSchema,
	checkOutDate: publicDateSchema,
});

export const publicRoomAvailabilityResponseSchema = z.object({
	roomId: z.string(),
	bookedRanges: z.array(publicBookedRangeSchema),
});

export type PublicPensionResponse = z.infer<typeof publicPensionResponseSchema>;
export type PublicRoomResponse = z.infer<typeof publicRoomResponseSchema>;
export type PublicRoomsResponse = z.infer<typeof publicRoomsResponseSchema>;
export type PublicRoomAvailabilityQueryInput = z.infer<
	typeof publicRoomAvailabilityQuerySchema
>;
export type PublicBookedRange = z.infer<typeof publicBookedRangeSchema>;
export type PublicRoomAvailabilityResponse = z.infer<
	typeof publicRoomAvailabilityResponseSchema
>;
export type { SiteConfigResponse, SiteContentResponse } from "./site-content";
export { siteConfigResponseSchema, siteContentResponseSchema };
