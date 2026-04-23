import { z } from "zod";
import { paginationMetaSchema, paginationQuerySchema } from "./pagination";

export const bookingStatusSchema = z.enum(["confirmed", "pending", "cancelled"]);

export const bookingSourceSchema = z.enum(["walk-in", "phone", "website", "agent"]);

export const bookingPaymentStatusSchema = z.enum(["paid", "partial", "unpaid"]);

export const bookingGuestSchema = z.object({
	name: z.string().trim().min(1),
	phone: z.string().trim().min(1).optional(),
	idNumber: z.string().trim().min(1).optional(),
});

const bookingTextSchema = z.string().trim().min(1);
const bookingOptionalTextSchema = z
	.union([z.string().trim().min(1), z.null()])
	.optional()
	.transform((value) => (value === null ? undefined : value));

const bookingDateSchema = z.iso.date();
const bookingAmountSchema = z.coerce.number().int().nonnegative();

export const createBookingSchema = z.object({
	guestName: bookingTextSchema,
	guestPhone: bookingOptionalTextSchema,
	guestIdNumber: bookingOptionalTextSchema,
	handledBy: bookingOptionalTextSchema,
	roomId: bookingTextSchema,
	status: bookingStatusSchema,
	checkInDate: bookingDateSchema,
	checkOutDate: bookingDateSchema,
	paidAmount: bookingAmountSchema,
	source: bookingSourceSchema,
});

export const updateBookingSchema = createBookingSchema;

export const listBookingsQuerySchema = paginationQuerySchema.extend({
	status: z.union([z.literal("all"), bookingStatusSchema]).optional(),
	search: z.string().trim().min(1).optional(),
});

export const bookingResponseSchema = z.object({
	id: z.string(),
	code: z.string(),
	guest: bookingGuestSchema,
	handledBy: z.string().optional(),
	roomId: z.string(),
	status: bookingStatusSchema,
	checkIn: bookingDateSchema,
	checkOut: bookingDateSchema,
	checkInDate: bookingDateSchema,
	checkOutDate: bookingDateSchema,
	nights: z.number().int().nonnegative(),
	totalAmount: z.number().int().nonnegative(),
	paidAmount: z.number().int().nonnegative(),
	remainingAmount: z.number().int().nonnegative(),
	paymentStatus: bookingPaymentStatusSchema,
	dueDate: bookingDateSchema.optional(),
	createdAt: z.string(),
	source: bookingSourceSchema,
});

export const bookingListResponseSchema = z.object({
	data: z.array(bookingResponseSchema),
	meta: paginationMetaSchema,
});

export type BookingGuest = z.infer<typeof bookingGuestSchema>;
export type BookingStatusValue = z.infer<typeof bookingStatusSchema>;
export type BookingSource = z.infer<typeof bookingSourceSchema>;
export type BookingPaymentStatus = z.infer<typeof bookingPaymentStatusSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type ListBookingsQueryInput = z.infer<typeof listBookingsQuerySchema>;
export type BookingResponse = z.infer<typeof bookingResponseSchema>;
export type BookingListResponse = z.infer<typeof bookingListResponseSchema>;