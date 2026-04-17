import { Body, Controller, Get, Patch } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
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
