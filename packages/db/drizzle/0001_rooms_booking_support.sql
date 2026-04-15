CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"number" text NOT NULL,
	"floor" integer NOT NULL,
	"type" text NOT NULL,
	"manualStatus" text DEFAULT 'available' NOT NULL,
	"pricePerNight" integer NOT NULL,
	"capacity" integer NOT NULL,
	"assignedTo" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "rooms_number_lower_unique" ON "rooms" (lower("number"));

CREATE TABLE "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"roomId" text NOT NULL,
	"guestName" text NOT NULL,
	"guestPhone" text,
	"guestIdNumber" text,
	"status" text NOT NULL,
	"checkInDate" text NOT NULL,
	"checkOutDate" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_code_unique" UNIQUE("code"),
	CONSTRAINT "bookings_roomId_rooms_id_fk" FOREIGN KEY ("roomId") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action
);