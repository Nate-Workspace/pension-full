import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@Query() query: unknown) {
    return this.dashboardService.getSummary(query);
  }

  @Get('trends')
  getTrends(@Query() query: unknown) {
    return this.dashboardService.getTrends(query);
  }
}
