CREATE TYPE "public"."track_purchase_status" AS ENUM('pending', 'completed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TABLE "track_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"track_id" uuid NOT NULL,
	"price_paid" integer NOT NULL,
	"status" "track_purchase_status" DEFAULT 'pending' NOT NULL,
	"payment_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "track_purchases" ADD CONSTRAINT "track_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_purchases" ADD CONSTRAINT "track_purchases_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "track_purchases_user_idx" ON "track_purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "track_purchases_track_idx" ON "track_purchases" USING btree ("track_id");--> statement-breakpoint
CREATE INDEX "track_purchases_status_idx" ON "track_purchases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "track_purchases_user_track_idx" ON "track_purchases" USING btree ("user_id","track_id");