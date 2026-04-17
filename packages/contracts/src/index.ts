export { authSchemas, loginSchema, registerSchema } from "./auth";
export {
	dashboardOccupancyPointSchema,
	dashboardRevenuePointSchema,
	dashboardSummarySchema,
	dashboardTrendsSchema,
} from "./dashboard";
export {
	bookingGuestSchema,
	bookingPaymentStatusSchema,
	bookingResponseSchema,
	bookingSourceSchema,
	bookingStatusSchema,
	createBookingSchema,
	listBookingsQuerySchema,
	updateBookingSchema,
} from "./bookings";
export {
	createRoomSchema,
	listRoomsQuerySchema,
	roomCurrentGuestSchema,
	roomEffectiveStatusSchema,
	roomFilterStatusSchema,
	roomManualStatusSchema,
	roomResponseSchema,
	roomStatusUpdateSchema,
	roomStatusSchema,
	roomTypeSchema,
	updateRoomSchema,
} from "./rooms";

export type { LoginInput, RegisterInput } from "./auth";
export type { DashboardOccupancyPoint, DashboardRevenuePoint, DashboardSummary, DashboardTrends } from "./dashboard";
export type {
	BookingGuest,
	BookingPaymentStatus,
	BookingResponse,
	BookingSource,
	BookingStatusValue,
	CreateBookingInput,
	ListBookingsQueryInput,
	UpdateBookingInput,
} from "./bookings";
export type {
	CreateRoomInput,
	ListRoomsQueryInput,
	RoomCurrentGuest,
	RoomEffectiveStatus,
	RoomFilterStatus,
	RoomManualStatus,
	RoomResponse,
	RoomStatusUpdateInput,
	RoomStatusValue,
	RoomTypeValue,
	UpdateRoomInput,
} from "./rooms";
