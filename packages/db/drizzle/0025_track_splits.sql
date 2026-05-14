CREATE TYPE "public"."split_action" AS ENUM('created', 'percent_changed', 'role_changed', 'accepted', 'rejected', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."split_role" AS ENUM('owner', 'co_writer', 'producer', 'featured_artist', 'mixer', 'publisher', 'other');--> statement-breakpoint
CREATE TYPE "public"."split_status" AS ENUM('pending', 'accepted', 'rejected', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."split_type" AS ENUM('master', 'publishing');--> statement-breakpoint
CREATE TABLE "track_split_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"track_split_id" uuid,
	"track_id" uuid NOT NULL,
	"collaborator_user_id" uuid NOT NULL,
	"split_type" "split_type" NOT NULL,
	"action" "split_action" NOT NULL,
	"prior_data" jsonb,
	"new_data" jsonb NOT NULL,
	"actor_id" uuid,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "track_splits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"track_id" uuid NOT NULL,
	"collaborator_user_id" uuid NOT NULL,
	"split_type" "split_type" NOT NULL,
	"role" "split_role" NOT NULL,
	"percent_bp" integer NOT NULL,
	"status" "split_status" DEFAULT 'pending' NOT NULL,
	"created_by" uuid,
	"rejection_reason" text,
	"accepted_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "track_split_history" ADD CONSTRAINT "track_split_history_track_split_id_track_splits_id_fk" FOREIGN KEY ("track_split_id") REFERENCES "public"."track_splits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_split_history" ADD CONSTRAINT "track_split_history_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_splits" ADD CONSTRAINT "track_splits_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_splits" ADD CONSTRAINT "track_splits_collaborator_user_id_users_id_fk" FOREIGN KEY ("collaborator_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_splits" ADD CONSTRAINT "track_splits_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "track_split_history_track_idx" ON "track_split_history" USING btree ("track_id","created_at");--> statement-breakpoint
CREATE INDEX "track_split_history_collab_idx" ON "track_split_history" USING btree ("collaborator_user_id","created_at");--> statement-breakpoint
CREATE INDEX "track_split_history_actor_idx" ON "track_split_history" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "track_splits_unique_idx" ON "track_splits" USING btree ("track_id","split_type","collaborator_user_id");--> statement-breakpoint
CREATE INDEX "track_splits_payout_idx" ON "track_splits" USING btree ("track_id","split_type","status");--> statement-breakpoint
CREATE INDEX "track_splits_collab_idx" ON "track_splits" USING btree ("collaborator_user_id","status");