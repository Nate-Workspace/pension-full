import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { CmsModule } from './cms/cms.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PaymentsModule } from './payments/payments.module';
import { PublicModule } from './public/public.module';
import { ReportsModule } from './reports/reports.module';
import { RoomsModule } from './rooms/rooms.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    AuthModule,
    BookingsModule,
    CmsModule,
    DashboardModule,
    PublicModule,
    RoomsModule,
    PaymentsModule,
    ReportsModule,
    SettingsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
