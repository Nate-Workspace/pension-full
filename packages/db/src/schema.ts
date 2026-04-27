import { sql } from "drizzle-orm";
import {
  boolean,
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
export const bookingSourceEnum = ["walk-in", "phone", "website", "agent"] as const;
export const bookingStatusEnum = ["active", "upcoming", "checked_out", "canceled"] as const;
export const paymentMethodEnum = ["cash", "mobile_money"] as const;
export const paymentStatusEnum = ["paid", "partial", "unpaid"] as const;

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
    handledBy: text("handledBy"),
    isCanceled: boolean("isCanceled").notNull().default(false),
    checkInDate: text("checkInDate").notNull(),
    checkOutDate: text("checkOutDate").notNull(),
    checkedOutAt: timestamp("checkedOutAt", { mode: "date", withTimezone: true }),
    paidAmount: integer("paidAmount").notNull().default(0),
    source: text("source", { enum: bookingSourceEnum }).notNull().default("walk-in"),
    createdAt: timestamp("createdAt", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    codeUnique: uniqueIndex("bookings_code_unique").on(table.code),
  }),
);

export const payments = pgTable(
  "payments",
  {
    id: text("id").primaryKey(),
    bookingId: text("bookingId")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    roomId: text("roomId")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull().default(0),
    method: text("method", { enum: paymentMethodEnum }).notNull(),
    status: text("status", { enum: paymentStatusEnum }).notNull(),
    paidAt: timestamp("paidAt", { mode: "date", withTimezone: true }),
    reference: text("reference").notNull().unique(),
    createdAt: timestamp("createdAt", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

export const settings = pgTable("settings", {
  id: text("id").primaryKey(),
  pensionName: text("pensionName").notNull(),
  ownerName: text("ownerName").notNull(),
  contactPhone: text("contactPhone").notNull(),
  contactEmail: text("contactEmail").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  singleRoomPrice: integer("singleRoomPrice").notNull(),
  doubleRoomPrice: integer("doubleRoomPrice").notNull(),
  vipRoomPrice: integer("vipRoomPrice").notNull(),
  defaultCheckInTime: text("defaultCheckInTime").notNull(),
  defaultCheckOutTime: text("defaultCheckOutTime").notNull(),
  allowWalkInBookings: integer("allowWalkInBookings").notNull().default(1),
  autoMarkRoomCleaningAfterCheckout: integer("autoMarkRoomCleaningAfterCheckout").notNull().default(1),
  requireIdBeforeCheckIn: integer("requireIdBeforeCheckIn").notNull().default(1),
  sendPaymentReminders: integer("sendPaymentReminders").notNull().default(1),
  createdAt: timestamp("createdAt", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const schema = {
  users,
  rooms,
  bookings,
  payments,
  settings,
} as const;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;