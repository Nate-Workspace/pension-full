import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [SettingsModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
