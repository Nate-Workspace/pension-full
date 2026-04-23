import { z } from "zod";

export const sortOrderSchema = z.enum(["asc", "desc"]);

export const paginationQuerySchema = z.object({
	page: z.coerce.number().int().positive().optional(),
	pageSize: z.coerce.number().int().positive().max(100).optional(),
	sortBy: z.string().trim().min(1).optional(),
	order: sortOrderSchema.optional(),
});

export const paginationMetaSchema = z.object({
	page: z.number().int().positive(),
	pageSize: z.number().int().positive(),
	total: z.number().int().nonnegative(),
	totalPages: z.number().int().nonnegative(),
});

export type SortOrder = z.infer<typeof sortOrderSchema>;
export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;