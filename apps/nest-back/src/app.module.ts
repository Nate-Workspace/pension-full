import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [AuthModule, BookingsModule, DashboardModule, RoomsModule, PaymentsModule, ReportsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
