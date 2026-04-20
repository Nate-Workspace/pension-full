import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'staff')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  listPayments(@Query() query: unknown) {
    return this.paymentsService.listPayments(query);
  }

  @Get('summary')
  getSummary(@Query() query: unknown) {
    return this.paymentsService.getSummary(query);
  }

  @Get('trends')
  getTrends(@Query() query: unknown) {
    return this.paymentsService.getTrends(query);
  }
}
