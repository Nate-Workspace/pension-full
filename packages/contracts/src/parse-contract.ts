import { z } from "zod";

export function parseContract<T extends z.ZodTypeAny>(
	schema: T,
	value: unknown,
): z.infer<T> {
	return schema.parse(value);
}

export function safeParseContract<T extends z.ZodTypeAny>(
	schema: T,
	value: unknown,
):
	| { success: true; data: z.infer<T> }
	| { success: false; message: string } {
	const result = schema.safeParse(value);

	if (result.success) {
		return { success: true, data: result.data };
	}

	return {
		success: false,
		message: result.error.issues[0]?.message ?? "Invalid request payload.",
	};
}
