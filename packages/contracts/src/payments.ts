import { z } from "zod";
import { paginationMetaSchema, paginationQuerySchema } from "./pagination";

export const paymentMethodSchema = z.enum(["cash", "mobile_money"]);

export const paymentStatusSchema = z.enum(["paid", "partial", "unpaid"]);

export const paymentResponseSchema = z.object({
	id: z.string(),
	bookingId: z.string(),
	roomId: z.string(),
	amount: z.number().int().nonnegative(),
	method: paymentMethodSchema,
	status: paymentStatusSchema,
	paidAt: z.string().optional(),
	reference: z.string(),
	bookingCode: z.string(),
	guestName: z.string(),
	guestPhone: z.string().optional(),
	roomNumber: z.string(),
	outstanding: z.number().int().nonnegative(),
});

export const listPaymentsQuerySchema = paginationQuerySchema.extend({
	method: z.union([z.literal("all"), paymentMethodSchema]).optional(),
	status: z.union([z.literal("all"), paymentStatusSchema]).optional(),
	search: z.string().trim().min(1).optional(),
});

export const paymentListResponseSchema = z.object({
	data: z.array(paymentResponseSchema),
	meta: paginationMetaSchema,
});

export type PaymentMethodValue = z.infer<typeof paymentMethodSchema>;
export type PaymentStatusValue = z.infer<typeof paymentStatusSchema>;
export type PaymentResponse = z.infer<typeof paymentResponseSchema>;
export type ListPaymentsQueryInput = z.infer<typeof listPaymentsQuerySchema>;
export type PaymentListResponse = z.infer<typeof paymentListResponseSchema>;