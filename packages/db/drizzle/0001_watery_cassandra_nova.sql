CREATE TYPE "public"."broadcast_type" AS ENUM('text', 'voice_memo', 'announcement', 'exclusive');--> statement-breakpoint
CREATE TYPE "public"."beat_project_status" AS ENUM('draft', 'rendering', 'rendered', 'published');--> statement-breakpoint
CREATE TYPE "public"."episode_status" AS ENUM('recording', 'uploading', 'processing', 'draft', 'scheduled', 'published');--> statement-breakpoint
CREATE TYPE "public"."podcast_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"code" text NOT NULL,
	"discount_type" text DEFAULT 'percentage' NOT NULL,
	"discount_value" integer NOT NULL,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"subscriber_only" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"from_user_id" uuid NOT NULL,
	"to_email" text NOT NULL,
	"to_user_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"reason" text,
	"approved_by_host" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"ticket_type_id" uuid,
	"position" integer NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"notified_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broadcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"type" "broadcast_type" DEFAULT 'text' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"media_url" text,
	"subscribers_only" boolean DEFAULT true NOT NULL,
	"published_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "beat_project_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"file_key" text NOT NULL,
	"duration" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "beat_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"bpm" integer DEFAULT 120 NOT NULL,
	"time_signature" text DEFAULT '4/4' NOT NULL,
	"swing_amount" integer DEFAULT 0 NOT NULL,
	"duration" integer,
	"cover_url" text,
	"project_data" jsonb,
	"rendered_audio_key" text,
	"status" "beat_project_status" DEFAULT 'draft' NOT NULL,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "podcast_episodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"podcast_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"episode_number" integer,
	"season_number" integer,
	"audio_url" text,
	"original_file_key" text,
	"duration" integer,
	"file_size" integer,
	"peaks_json" jsonb,
	"chapters_json" jsonb,
	"transcription" text,
	"status" "episode_status" DEFAULT 'draft' NOT NULL,
	"publish_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"explicit" boolean DEFAULT false NOT NULL,
	"episode_type" text DEFAULT 'full' NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "podcasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"cover_url" text,
	"language" text DEFAULT 'en' NOT NULL,
	"category" text,
	"subcategory" text,
	"author" text,
	"owner_email" text,
	"explicit" boolean DEFAULT false NOT NULL,
	"website_url" text,
	"status" "podcast_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_transfers" ADD CONSTRAINT "ticket_transfers_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_transfers" ADD CONSTRAINT "ticket_transfers_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_transfers" ADD CONSTRAINT "ticket_transfers_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_ticket_type_id_ticket_types_id_fk" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "broadcasts" ADD CONSTRAINT "broadcasts_artist_id_users_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beat_project_samples" ADD CONSTRAINT "beat_project_samples_project_id_beat_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."beat_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beat_projects" ADD CONSTRAINT "beat_projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "podcast_episodes" ADD CONSTRAINT "podcast_episodes_podcast_id_podcasts_id_fk" FOREIGN KEY ("podcast_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "podcasts" ADD CONSTRAINT "podcasts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "promo_event_idx" ON "promo_codes" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "transfer_ticket_idx" ON "ticket_transfers" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "waitlist_event_idx" ON "waitlist" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "waitlist_user_idx" ON "waitlist" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "beat_samples_project_id_idx" ON "beat_project_samples" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "beat_projects_user_id_idx" ON "beat_projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "beat_projects_status_idx" ON "beat_projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "episodes_podcast_id_idx" ON "podcast_episodes" USING btree ("podcast_id");--> statement-breakpoint
CREATE INDEX "episodes_status_idx" ON "podcast_episodes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "episodes_publish_at_idx" ON "podcast_episodes" USING btree ("publish_at");--> statement-breakpoint
CREATE INDEX "podcasts_user_id_idx" ON "podcasts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "podcasts_slug_idx" ON "podcasts" USING btree ("slug");