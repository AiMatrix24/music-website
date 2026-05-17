CREATE TYPE "public"."booking_contract_status" AS ENUM('draft', 'signed', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."booking_payment_terms" AS ENUM('upfront', 'at_event', 'after_event', 'door_split_only');--> statement-breakpoint
CREATE TABLE "booking_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"slot_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"venue_owner_user_id" uuid NOT NULL,
	"creator_user_id" uuid NOT NULL,
	"event_start" timestamp with time zone NOT NULL,
	"event_end" timestamp with time zone NOT NULL,
	"creator_fee_cents" integer,
	"ticket_split_bp" integer,
	"concession_split_bp" integer,
	"payment_terms" "booking_payment_terms" DEFAULT 'at_event' NOT NULL,
	"set_length_minutes" integer,
	"soundcheck_at" timestamp with time zone,
	"rider_text" text,
	"cancellation_policy" text,
	"venue_signed_at" timestamp with time zone,
	"creator_signed_at" timestamp with time zone,
	"status" "booking_contract_status" DEFAULT 'draft' NOT NULL,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancellation_reason" text,
	"cancelled_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_contracts" ADD CONSTRAINT "booking_contracts_application_id_booking_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."booking_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_contracts" ADD CONSTRAINT "booking_contracts_slot_id_venue_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."venue_slots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_contracts" ADD CONSTRAINT "booking_contracts_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_contracts" ADD CONSTRAINT "booking_contracts_venue_owner_user_id_users_id_fk" FOREIGN KEY ("venue_owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_contracts" ADD CONSTRAINT "booking_contracts_creator_user_id_users_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_contracts" ADD CONSTRAINT "booking_contracts_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contracts_app_unique_idx" ON "booking_contracts" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "contracts_venue_idx" ON "booking_contracts" USING btree ("venue_owner_user_id","status");--> statement-breakpoint
CREATE INDEX "contracts_creator_idx" ON "booking_contracts" USING btree ("creator_user_id","status");--> statement-breakpoint
CREATE INDEX "contracts_status_event_idx" ON "booking_contracts" USING btree ("status","event_start");