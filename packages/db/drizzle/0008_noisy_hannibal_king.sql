ALTER TABLE "events" ALTER COLUMN "description" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "venue_name" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "venue_city" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "venue_address" text;