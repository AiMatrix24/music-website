CREATE TYPE "public"."booking_application_status" AS ENUM('pending', 'accepted', 'declined', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."slot_status" AS ENUM('open', 'filled', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."slot_type" AS ENUM('open_mic', 'paid', 'door_split', 'showcase');--> statement-breakpoint
CREATE TABLE "booking_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_id" uuid NOT NULL,
	"creator_user_id" uuid NOT NULL,
	"message" text,
	"proposed_fee_cents" integer,
	"status" "booking_application_status" DEFAULT 'pending' NOT NULL,
	"decision_message" text,
	"decided_at" timestamp with time zone,
	"decided_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venue_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"slot_type" "slot_type" NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"compensation_cents" integer,
	"door_split_bp" integer,
	"genres" jsonb,
	"capacity_hint" integer,
	"status" "slot_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "owner_user_id" uuid;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "genres" jsonb;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "amenities" jsonb;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "contact_phone" text;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "cover_url" text;--> statement-breakpoint
ALTER TABLE "booking_applications" ADD CONSTRAINT "booking_applications_slot_id_venue_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."venue_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_applications" ADD CONSTRAINT "booking_applications_creator_user_id_users_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_applications" ADD CONSTRAINT "booking_applications_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_slots" ADD CONSTRAINT "venue_slots_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_slots" ADD CONSTRAINT "venue_slots_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "booking_apps_unique_idx" ON "booking_applications" USING btree ("slot_id","creator_user_id");--> statement-breakpoint
CREATE INDEX "booking_apps_creator_idx" ON "booking_applications" USING btree ("creator_user_id","status");--> statement-breakpoint
CREATE INDEX "booking_apps_slot_status_idx" ON "booking_applications" USING btree ("slot_id","status");--> statement-breakpoint
CREATE INDEX "venue_slots_venue_idx" ON "venue_slots" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "venue_slots_owner_idx" ON "venue_slots" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "venue_slots_status_idx" ON "venue_slots" USING btree ("status","start_time");--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "venues_owner_idx" ON "venues" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "venues_city_idx" ON "venues" USING btree ("city");