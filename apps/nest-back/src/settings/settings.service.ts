import { BadRequestException, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db, settings as settingsTable } from '@repo/db';

type SettingsRecord = typeof settingsTable.$inferSelect;

export type PensionInfoResponse = {
  pensionName: string;
  ownerName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  city: string;
};

export type PricingResponse = {
  single: number;
  double: number;
  vip: number;
};

export type OperationalPreferencesResponse = {
  defaultCheckInTime: string;
  defaultCheckOutTime: string;
  allowWalkInBookings: boolean;
  autoMarkRoomCleaningAfterCheckout: boolean;
  requireIdBeforeCheckIn: boolean;
  sendPaymentReminders: boolean;
};

const SETTINGS_ID = 'main';

@Injectable()
export class SettingsService {
  async getPensionInfo(): Promise<PensionInfoResponse> {
    const current = await this.getOrCreateSettings();
    return this.toPensionInfo(current);
  }

  async updatePensionInfo(body: unknown): Promise<PensionInfoResponse> {
    const input = this.parsePensionInfo(body);
    const current = await this.getOrCreateSettings();

    const next = {
      pensionName: input.pensionName?.trim() ?? current.pensionName,
      ownerName: input.ownerName?.trim() ?? current.ownerName,
      contactPhone: input.contactPhone?.trim() ?? current.contactPhone,
      contactEmail: input.contactEmail?.trim() ?? current.contactEmail,
      address: input.address?.trim() ?? current.address,
      city: input.city?.trim() ?? current.city,
      updatedAt: new Date(),
    };

    this.validateRequiredFields(next);

    const updatedRows = (await db
      .update(settingsTable)
      .set(next)
      .where(eq(settingsTable.id, SETTINGS_ID))
      .returning()) as SettingsRecord[];

    const updated = updatedRows[0];

    if (!updated) {
      throw new BadRequestException('Unable to update settings.');
    }

    return this.toPensionInfo(updated);
  }

  async getPricing(): Promise<PricingResponse> {
    const current = await this.getOrCreateSettings();
    return this.toPricing(current);
  }

  async updatePricing(body: unknown): Promise<PricingResponse> {
    const input = this.parsePricing(body);
    const current = await this.getOrCreateSettings();

    const next = {
      singleRoomPrice: input.single ?? current.singleRoomPrice,
      doubleRoomPrice: input.double ?? current.doubleRoomPrice,
      vipRoomPrice: input.vip ?? current.vipRoomPrice,
      updatedAt: new Date(),
    };

    this.validatePricing(next.singleRoomPrice, next.doubleRoomPrice, next.vipRoomPrice);

    const updatedRows = (await db
      .update(settingsTable)
      .set(next)
      .where(eq(settingsTable.id, SETTINGS_ID))
      .returning()) as SettingsRecord[];

    const updated = updatedRows[0];

    if (!updated) {
      throw new BadRequestException('Unable to update settings.');
    }

    return this.toPricing(updated);
  }

  async getOperationalPreferences(): Promise<OperationalPreferencesResponse> {
    const current = await this.getOrCreateSettings();
    return this.toOperationalPreferences(current);
  }

  async updateOperationalPreferences(body: unknown): Promise<OperationalPreferencesResponse> {
    const input = this.parseOperationalPreferences(body);
    const current = await this.getOrCreateSettings();

    const next = {
      defaultCheckInTime: input.defaultCheckInTime ?? current.defaultCheckInTime,
      defaultCheckOutTime: input.defaultCheckOutTime ?? current.defaultCheckOutTime,
      allowWalkInBookings: this.toFlag(input.allowWalkInBookings, current.allowWalkInBookings),
      autoMarkRoomCleaningAfterCheckout: this.toFlag(
        input.autoMarkRoomCleaningAfterCheckout,
        current.autoMarkRoomCleaningAfterCheckout,
      ),
      requireIdBeforeCheckIn: this.toFlag(
        input.requireIdBeforeCheckIn,
        current.requireIdBeforeCheckIn,
      ),
      sendPaymentReminders: this.toFlag(
        input.sendPaymentReminders,
        current.sendPaymentReminders,
      ),
      updatedAt: new Date(),
    };

    this.validateTime(next.defaultCheckInTime, 'defaultCheckInTime');
    this.validateTime(next.defaultCheckOutTime, 'defaultCheckOutTime');

    const updatedRows = (await db
      .update(settingsTable)
      .set(next)
      .where(eq(settingsTable.id, SETTINGS_ID))
      .returning()) as SettingsRecord[];

    const updated = updatedRows[0];

    if (!updated) {
      throw new BadRequestException('Unable to update settings.');
    }

    return this.toOperationalPreferences(updated);
  }

  private async getOrCreateSettings(): Promise<SettingsRecord> {
    const existingRows = (await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.id, SETTINGS_ID))
      .limit(1)) as SettingsRecord[];

    const existing = existingRows[0];

    if (existing) {
      return existing;
    }

    const insertedRows = (await db
      .insert(settingsTable)
      .values(this.defaultSettingsRow())
      .returning()) as SettingsRecord[];

    const inserted = insertedRows[0];

    if (!inserted) {
      throw new BadRequestException('Unable to initialize settings.');
    }

    return inserted;
  }

  private defaultSettingsRow(): typeof settingsTable.$inferInsert {
    return {
      id: SETTINGS_ID,
      pensionName: 'Hillside Guest House',
      ownerName: 'Guest House Owner',
      contactPhone: '+221 77 000 9988',
      contactEmail: 'admin@hillsideguesthouse.org',
      address: 'Bole Brass',
      city: 'Addis Ababa',
      singleRoomPrice: 2200,
      doubleRoomPrice: 4400,
      vipRoomPrice: 5250,
      defaultCheckInTime: '14:00',
      defaultCheckOutTime: '11:00',
      allowWalkInBookings: 1,
      autoMarkRoomCleaningAfterCheckout: 1,
      requireIdBeforeCheckIn: 1,
      sendPaymentReminders: 1,
    };
  }

  private toPensionInfo(settings: SettingsRecord): PensionInfoResponse {
    return {
      pensionName: settings.pensionName,
      ownerName: settings.ownerName,
      contactPhone: settings.contactPhone,
      contactEmail: settings.contactEmail,
      address: settings.address,
      city: settings.city,
    };
  }

  private toPricing(settings: SettingsRecord): PricingResponse {
    return {
      single: settings.singleRoomPrice,
      double: settings.doubleRoomPrice,
      vip: settings.vipRoomPrice,
    };
  }

  private toOperationalPreferences(settings: SettingsRecord): OperationalPreferencesResponse {
    return {
      defaultCheckInTime: settings.defaultCheckInTime,
      defaultCheckOutTime: settings.defaultCheckOutTime,
      allowWalkInBookings: settings.allowWalkInBookings === 1,
      autoMarkRoomCleaningAfterCheckout: settings.autoMarkRoomCleaningAfterCheckout === 1,
      requireIdBeforeCheckIn: settings.requireIdBeforeCheckIn === 1,
      sendPaymentReminders: settings.sendPaymentReminders === 1,
    };
  }

  private parsePensionInfo(value: unknown): Partial<PensionInfoResponse> {
    if (value === undefined || value === null) {
      return {};
    }

    const record = this.toRecord(value);

    return {
      pensionName: this.optionalString(record.pensionName, 'pensionInfo.pensionName'),
      ownerName: this.optionalString(record.ownerName, 'pensionInfo.ownerName'),
      contactPhone: this.optionalString(record.contactPhone, 'pensionInfo.contactPhone'),
      contactEmail: this.optionalString(record.contactEmail, 'pensionInfo.contactEmail'),
      address: this.optionalString(record.address, 'pensionInfo.address'),
      city: this.optionalString(record.city, 'pensionInfo.city'),
    };
  }

  private parsePricing(value: unknown): Partial<PricingResponse> {
    if (value === undefined || value === null) {
      return {};
    }

    const record = this.toRecord(value);

    return {
      single: this.optionalNonNegativeInteger(record.single, 'pricing.single'),
      double: this.optionalNonNegativeInteger(record.double, 'pricing.double'),
      vip: this.optionalNonNegativeInteger(record.vip, 'pricing.vip'),
    };
  }

  private parseOperationalPreferences(value: unknown): Partial<OperationalPreferencesResponse> {
    if (value === undefined || value === null) {
      return {};
    }

    const record = this.toRecord(value);

    return {
      defaultCheckInTime: this.optionalTime(record.defaultCheckInTime, 'operationalPreferences.defaultCheckInTime'),
      defaultCheckOutTime: this.optionalTime(record.defaultCheckOutTime, 'operationalPreferences.defaultCheckOutTime'),
      allowWalkInBookings: this.optionalBoolean(record.allowWalkInBookings, 'operationalPreferences.allowWalkInBookings'),
      autoMarkRoomCleaningAfterCheckout: this.optionalBoolean(
        record.autoMarkRoomCleaningAfterCheckout,
        'operationalPreferences.autoMarkRoomCleaningAfterCheckout',
      ),
      requireIdBeforeCheckIn: this.optionalBoolean(
        record.requireIdBeforeCheckIn,
        'operationalPreferences.requireIdBeforeCheckIn',
      ),
      sendPaymentReminders: this.optionalBoolean(
        record.sendPaymentReminders,
        'operationalPreferences.sendPaymentReminders',
      ),
    };
  }

  private validateRequiredFields(next: {
    pensionName: string;
    ownerName: string;
    contactPhone: string;
    contactEmail: string;
    address: string;
    city: string;
  }): void {
    const fields = [
      ['pensionName', next.pensionName],
      ['ownerName', next.ownerName],
      ['contactPhone', next.contactPhone],
      ['contactEmail', next.contactEmail],
      ['address', next.address],
      ['city', next.city],
    ] as const;

    for (const [name, value] of fields) {
      if (value.trim().length === 0) {
        throw new BadRequestException(`${name} cannot be empty.`);
      }
    }
  }

  private validatePricing(single: number, double: number, vip: number): void {
    if (single < 0 || double < 0 || vip < 0) {
      throw new BadRequestException('Pricing values must be non-negative numbers.');
    }
  }

  private validateTime(value: string, field: string): void {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
      throw new BadRequestException(`${field} must be in HH:mm format.`);
    }
  }

  private toFlag(value: boolean | undefined, fallback: number): number {
    if (value === undefined) {
      return fallback;
    }

    return value ? 1 : 0;
  }

  private optionalString(value: unknown, field: string): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${field} must be a string.`);
    }

    return value;
  }

  private optionalNonNegativeInteger(value: unknown, field: string): number | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    const parsed = typeof value === 'number' ? value : Number(value);

    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new BadRequestException(`${field} must be a non-negative integer.`);
    }

    return parsed;
  }

  private optionalTime(value: unknown, field: string): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
      throw new BadRequestException(`${field} must be in HH:mm format.`);
    }

    return value;
  }

  private optionalBoolean(value: unknown, field: string): boolean | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value !== 'boolean') {
      throw new BadRequestException(`${field} must be a boolean.`);
    }

    return value;
  }

  private toRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException('Invalid payload.');
    }

    return value as Record<string, unknown>;
  }
}
