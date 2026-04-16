ALTER TABLE "bookings" ADD COLUMN "handledBy" text;

ALTER TABLE "bookings" ADD COLUMN "paidAmount" integer NOT NULL DEFAULT 0;

ALTER TABLE "bookings" ADD COLUMN "source" text NOT NULL DEFAULT 'walk-in';