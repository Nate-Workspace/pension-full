export { db, getDatabaseConfig, getDb, getResolvedDatabaseConfig } from "./db";
export type { DatabaseConfig, DbProvider } from "./db";

export { bookings, payments, rooms, schema, settings, users } from "./schema";
export type {
	Booking,
	NewBooking,
	NewPayment,
	NewRoom,
	NewSettings,
	NewUser,
	Payment,
	Room,
	Settings,
	User,
} from "./schema";