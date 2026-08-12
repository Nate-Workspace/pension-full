CREATE TABLE "site_config" (
	"id" text PRIMARY KEY NOT NULL,
	"pensionName" text DEFAULT '' NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"heroImageUrl" text DEFAULT '' NOT NULL,
	"heroHeadline" text DEFAULT '' NOT NULL,
	"heroSubtext" text DEFAULT '' NOT NULL,
	"aboutDescription" text DEFAULT '' NOT NULL,
	"cancellationPolicy" text DEFAULT '' NOT NULL,
	"termsText" text DEFAULT '' NOT NULL,
	"privacyText" text DEFAULT '' NOT NULL,
	"mapEmbedUrl" text DEFAULT '' NOT NULL,
	"mapLat" text DEFAULT '' NOT NULL,
	"mapLng" text DEFAULT '' NOT NULL,
	"allowOnlineBookings" integer DEFAULT 1 NOT NULL,
	"contactPhone" text DEFAULT '' NOT NULL,
	"contactEmail" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_gallery_items" (
	"id" text PRIMARY KEY NOT NULL,
	"imageUrl" text NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_amenities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_faqs" (
	"id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_attractions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"distance" text DEFAULT '' NOT NULL,
	"imageUrl" text DEFAULT '' NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_page_content" (
	"pageSlug" text NOT NULL,
	"sectionKey" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "site_page_content_pageSlug_sectionKey_pk" PRIMARY KEY("pageSlug","sectionKey")
);
