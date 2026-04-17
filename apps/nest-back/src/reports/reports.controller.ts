import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('analytics')
  getAnalytics(@Query() query: unknown) {
    return this.reportsService.getAnalytics(query);
  }
}
