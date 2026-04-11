import { z } from "zod";

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  role: z.enum(["admin", "staff"]),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const authSchemas = {
  register: registerSchema,
  login: loginSchema,
} as const;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;