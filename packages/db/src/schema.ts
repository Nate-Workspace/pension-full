import { sql } from "drizzle-orm";
import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const roomTypeEnum = ["single", "double", "vip"] as const;
export const roomManualStatusEnum = ["available", "cleaning", "maintenance"] as const;
export const roomStatusEnum = ["available", "occupied", "cleaning", "maintenance"] as const;
export const bookingStatusEnum = ["confirmed", "pending", "cancelled"] as const;

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "staff"] }).notNull(),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const rooms = pgTable(
  "rooms",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    number: text("number").notNull(),
    floor: integer("floor").notNull(),
    type: text("type", { enum: roomTypeEnum }).notNull(),
    manualStatus: text("manualStatus", { enum: roomManualStatusEnum }).notNull().default("available"),
    pricePerNight: integer("pricePerNight").notNull(),
    capacity: integer("capacity").notNull(),
    assignedTo: text("assignedTo"),
    createdAt: timestamp("createdAt", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    numberLowerUnique: uniqueIndex("rooms_number_lower_unique").on(sql`lower(${table.number})`),
  }),
);

export const bookings = pgTable(
  "bookings",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    roomId: text("roomId")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    guestName: text("guestName").notNull(),
    guestPhone: text("guestPhone"),
    guestIdNumber: text("guestIdNumber"),
    status: text("status", { enum: bookingStatusEnum }).notNull(),
    checkInDate: text("checkInDate").notNull(),
    checkOutDate: text("checkOutDate").notNull(),
    createdAt: timestamp("createdAt", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    codeUnique: uniqueIndex("bookings_code_unique").on(table.code),
  }),
);

export const schema = {
  users,
  rooms,
  bookings,
} as const;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;