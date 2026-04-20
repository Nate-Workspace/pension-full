import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('pension-info')
  getPensionInfo() {
    return this.settingsService.getPensionInfo();
  }

  @Patch('pension-info')
  updatePensionInfo(@Body() body: unknown) {
    return this.settingsService.updatePensionInfo(body);
  }

  @Get('pricing')
  getPricing() {
    return this.settingsService.getPricing();
  }

  @Patch('pricing')
  updatePricing(@Body() body: unknown) {
    return this.settingsService.updatePricing(body);
  }

  @Get('operational-preferences')
  getOperationalPreferences() {
    return this.settingsService.getOperationalPreferences();
  }

  @Patch('operational-preferences')
  updateOperationalPreferences(@Body() body: unknown) {
    return this.settingsService.updateOperationalPreferences(body);
  }
}
