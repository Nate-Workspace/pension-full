ALTER TABLE "site_config" ADD COLUMN IF NOT EXISTS "sameDayBookingCutoffTime" text DEFAULT '18:00' NOT NULL;
