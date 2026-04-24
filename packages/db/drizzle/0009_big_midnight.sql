ALTER TABLE "events" ADD COLUMN "venue_lat" real;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "venue_lng" real;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "geofence_radius_meters" integer DEFAULT 100;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "geofence_enforced" boolean DEFAULT false NOT NULL;