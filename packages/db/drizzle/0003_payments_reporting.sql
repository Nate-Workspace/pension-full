CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"bookingId" text NOT NULL,
	"roomId" text NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"method" text NOT NULL,
	"status" text NOT NULL,
	"paidAt" timestamp with time zone,
	"reference" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_reference_unique" UNIQUE("reference"),
	CONSTRAINT "payments_bookingId_bookings_id_fk" FOREIGN KEY ("bookingId") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "payments_roomId_rooms_id_fk" FOREIGN KEY ("roomId") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action
);
