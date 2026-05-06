CREATE TYPE "public"."takedown_status" AS ENUM('pending', 'approved', 'rejected', 'withdrawn');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'suspended';--> statement-breakpoint
CREATE TABLE "takedown_notices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"track_id" uuid,
	"target_url" text NOT NULL,
	"claimant_name" text NOT NULL,
	"claimant_email" text NOT NULL,
	"claimant_organization" text,
	"claimant_address" text NOT NULL,
	"claimant_phone" text,
	"infringed_work_title" text NOT NULL,
	"infringed_work_owner" text NOT NULL,
	"description" text NOT NULL,
	"good_faith_statement" boolean DEFAULT false NOT NULL,
	"accuracy_statement" boolean DEFAULT false NOT NULL,
	"signature" text NOT NULL,
	"status" "takedown_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_from_ip" text
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dmca_strikes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "takedown_notices" ADD CONSTRAINT "takedown_notices_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "takedown_notices" ADD CONSTRAINT "takedown_notices_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "takedown_track_idx" ON "takedown_notices" USING btree ("track_id");--> statement-breakpoint
CREATE INDEX "takedown_status_idx" ON "takedown_notices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "takedown_submitted_idx" ON "takedown_notices" USING btree ("submitted_at");