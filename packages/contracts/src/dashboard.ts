import { z } from "zod";

export const dashboardOccupancyPointSchema = z.object({
	label: z.string(),
	occupancyRate: z.number().int().nonnegative(),
});

export const dashboardRevenuePointSchema = z.object({
	label: z.string(),
	revenue: z.number().int().nonnegative(),
});

export const dashboardSummarySchema = z.object({
	operationDay: z.iso.date(),
	totalRooms: z.number().int().nonnegative(),
	occupiedRooms: z.number().int().nonnegative(),
	availableRooms: z.number().int().nonnegative(),
	cleaningRooms: z.number().int().nonnegative(),
	todayRevenue: z.number().int().nonnegative(),
	monthlyRevenue: z.number().int().nonnegative(),
	outstandingPayments: z.number().int().nonnegative(),
	occupancyRate: z.number().int().nonnegative(),
});

export const dashboardTrendsSchema = z.object({
	operationDay: z.iso.date(),
	occupancySeries: z.array(dashboardOccupancyPointSchema),
	revenueSeries: z.array(dashboardRevenuePointSchema),
});

export type DashboardOccupancyPoint = z.infer<typeof dashboardOccupancyPointSchema>;
export type DashboardRevenuePoint = z.infer<typeof dashboardRevenuePointSchema>;
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
export type DashboardTrends = z.infer<typeof dashboardTrendsSchema>;
