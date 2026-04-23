import { z } from "zod";
import { paginationMetaSchema, paginationQuerySchema } from "./pagination";

export const roomTypeSchema = z.enum(["single", "double", "vip"]);

export const roomManualStatusSchema = z.enum(["available", "cleaning", "maintenance"]);

export const roomStatusSchema = z.enum(["available", "occupied", "cleaning", "maintenance"]);

export const roomEffectiveStatusSchema = roomStatusSchema;

export const roomFilterStatusSchema = z.union([z.literal("all"), roomStatusSchema]);

export const roomCurrentGuestSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1).optional(),
  idNumber: z.string().trim().min(1).optional(),
});

const roomNumberSchema = z.string().trim().min(2);
const numericFieldSchema = z.coerce.number().int().positive();
const assignedToSchema = z.union([z.string(), z.null()]).optional();

const roomBaseInputSchema = z.object({
  number: roomNumberSchema,
  floor: numericFieldSchema,
  type: roomTypeSchema,
  capacity: numericFieldSchema,
  pricePerNight: numericFieldSchema,
  assignedTo: assignedToSchema,
});

export const createRoomSchema = roomBaseInputSchema.extend({
  status: roomStatusSchema,
});

export const updateRoomSchema = roomBaseInputSchema;

export const roomStatusUpdateSchema = z.object({
  status: roomStatusSchema,
});

export const listRoomsQuerySchema = paginationQuerySchema.extend({
  status: roomFilterStatusSchema.optional(),
  operationDay: z.iso.date().optional(),
  search: z.string().trim().min(1).optional(),
  type: roomTypeSchema.optional(),
});

export const roomResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  number: z.string(),
  floor: z.number(),
  type: roomTypeSchema,
  status: roomStatusSchema,
  price: z.number(),
  pricePerNight: z.number(),
  capacity: z.number(),
  assignedTo: z.string().optional(),
  currentGuest: roomCurrentGuestSchema.optional(),
});

export const roomListResponseSchema = z.object({
  data: z.array(roomResponseSchema),
  meta: paginationMetaSchema,
});

export type RoomTypeValue = z.infer<typeof roomTypeSchema>;
export type RoomManualStatus = z.infer<typeof roomManualStatusSchema>;
export type RoomStatusValue = z.infer<typeof roomStatusSchema>;
export type RoomEffectiveStatus = z.infer<typeof roomEffectiveStatusSchema>;
export type RoomFilterStatus = z.infer<typeof roomFilterStatusSchema>;
export type RoomCurrentGuest = z.infer<typeof roomCurrentGuestSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type RoomStatusUpdateInput = z.infer<typeof roomStatusUpdateSchema>;
export type ListRoomsQueryInput = z.infer<typeof listRoomsQuerySchema>;
export type RoomResponse = z.infer<typeof roomResponseSchema>;
export type RoomListResponse = z.infer<typeof roomListResponseSchema>;