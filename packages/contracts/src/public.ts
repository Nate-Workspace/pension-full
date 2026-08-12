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

export const publicBookingCheckoutSchema = z.object({
	roomId: z.string().trim().min(1),
	guestName: z.string().trim().min(1),
	guestPhone: z.string().trim().min(1),
	checkInDate: publicDateSchema,
	checkOutDate: publicDateSchema,
});

export const publicBookingCheckoutResponseSchema = z.object({
	code: z.string(),
	roomId: z.string(),
	roomName: z.string(),
	roomNumber: z.string(),
	guestName: z.string(),
	checkInDate: publicDateSchema,
	checkOutDate: publicDateSchema,
	nights: z.number().int().positive(),
	pricePerNight: z.number().int().nonnegative(),
	totalAmount: z.number().int().nonnegative(),
	paidAmount: z.number().int().nonnegative(),
	paymentStatus: z.literal("paid"),
	defaultCheckInTime: z.string(),
	defaultCheckOutTime: z.string(),
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
export type PublicBookingCheckoutInput = z.infer<
	typeof publicBookingCheckoutSchema
>;
export type PublicBookingCheckoutResponse = z.infer<
	typeof publicBookingCheckoutResponseSchema
>;
export type { SiteConfigResponse, SiteContentResponse } from "./site-content";
export { siteConfigResponseSchema, siteContentResponseSchema };
