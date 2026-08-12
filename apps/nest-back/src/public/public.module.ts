import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { PublicController } from './public.controller';
import { PublicRateLimitGuard } from './public-rate-limit.guard';
import { PublicService } from './public.service';

@Module({
  imports: [SettingsModule],
  controllers: [PublicController],
  providers: [PublicService, PublicRateLimitGuard],
})
export class PublicModule {}
