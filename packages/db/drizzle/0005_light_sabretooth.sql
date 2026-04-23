CREATE TYPE "public"."tip_status" AS ENUM('pending', 'completed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TABLE "tips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipper_user_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"track_id" uuid,
	"amount" integer NOT NULL,
	"message" text,
	"status" "tip_status" DEFAULT 'pending' NOT NULL,
	"payment_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tips" ADD CONSTRAINT "tips_tipper_user_id_users_id_fk" FOREIGN KEY ("tipper_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tips" ADD CONSTRAINT "tips_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tips" ADD CONSTRAINT "tips_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tips_tipper_idx" ON "tips" USING btree ("tipper_user_id");--> statement-breakpoint
CREATE INDEX "tips_recipient_idx" ON "tips" USING btree ("recipient_user_id");--> statement-breakpoint
CREATE INDEX "tips_status_idx" ON "tips" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tips_recipient_status_idx" ON "tips" USING btree ("recipient_user_id","status");