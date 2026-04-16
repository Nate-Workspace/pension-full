export { db, getDatabaseConfig, getDb, getResolvedDatabaseConfig } from "./db";
export type { DatabaseConfig, DbProvider } from "./db";

export { bookings, payments, rooms, schema, users } from "./schema";
export type {
	Booking,
	NewBooking,
	NewPayment,
	NewRoom,
	NewUser,
	Payment,
	Room,
	User,
} from "./schema";