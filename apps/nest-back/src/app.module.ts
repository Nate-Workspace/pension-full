import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [AuthModule, RoomsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
