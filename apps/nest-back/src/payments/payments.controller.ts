import { Controller, Get, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
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
