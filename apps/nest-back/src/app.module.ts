import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [AuthModule, BookingsModule, RoomsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
