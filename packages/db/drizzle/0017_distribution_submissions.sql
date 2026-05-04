CREATE TYPE "public"."distribution_status" AS ENUM('pending', 'in_review', 'submitted', 'live', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."distribution_subject" AS ENUM('track', 'album');--> statement-breakpoint
CREATE TABLE "distribution_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subject_type" "distribution_subject" NOT NULL,
	"subject_id" uuid NOT NULL,
	"status" "distribution_status" DEFAULT 'pending' NOT NULL,
	"target_tiers" text[] DEFAULT '{}' NOT NULL,
	"release_date" timestamp with time zone,
	"copyright_certified" boolean DEFAULT false NOT NULL,
	"splits_confirmed" boolean DEFAULT false NOT NULL,
	"creator_notes" text,
	"admin_notes" text,
	"aggregator_name" text,
	"aggregator_ref_id" text,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "distribution_submissions" ADD CONSTRAINT "distribution_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_submissions" ADD CONSTRAINT "distribution_submissions_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dist_user_idx" ON "distribution_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "dist_status_idx" ON "distribution_submissions" USING btree ("status");