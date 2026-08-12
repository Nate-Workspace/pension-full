import { z } from "zod";
import { bookingPaymentStatusSchema, bookingStatusSchema } from "./bookings";
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

export const publicBookingCheckoutSchema = z
	.object({
		roomId: z.string().trim().min(1),
		guestName: z.string().trim().min(1),
		guestPhone: z.string().trim().min(1).optional(),
		guestEmail: z.string().trim().email().optional(),
		checkInDate: publicDateSchema,
		checkOutDate: publicDateSchema,
	})
	.refine((value) => Boolean(value.guestPhone || value.guestEmail), {
		message: "Either guestPhone or guestEmail is required.",
		path: ["guestPhone"],
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

export const publicBookingLookupQuerySchema = z.object({
	code: z.string().trim().min(1),
	contact: z.string().trim().min(1),
});

export const publicBookingLookupResponseSchema = z.object({
	code: z.string(),
	status: bookingStatusSchema,
	roomName: z.string(),
	roomNumber: z.string(),
	guestName: z.string(),
	checkInDate: publicDateSchema,
	checkOutDate: publicDateSchema,
	nights: z.number().int().positive(),
	totalAmount: z.number().int().nonnegative(),
	paidAmount: z.number().int().nonnegative(),
	paymentStatus: bookingPaymentStatusSchema,
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
export type PublicBookingLookupQueryInput = z.infer<
	typeof publicBookingLookupQuerySchema
>;
export type PublicBookingLookupResponse = z.infer<
	typeof publicBookingLookupResponseSchema
>;
export type { SiteConfigResponse, SiteContentResponse } from "./site-content";
export { siteConfigResponseSchema, siteContentResponseSchema };
