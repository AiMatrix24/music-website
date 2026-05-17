CREATE TYPE "public"."album_purchase_status" AS ENUM('pending', 'completed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TABLE "album_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"album_id" uuid NOT NULL,
	"price_paid" integer NOT NULL,
	"status" "album_purchase_status" DEFAULT 'pending' NOT NULL,
	"payment_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "album_purchases" ADD CONSTRAINT "album_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_purchases" ADD CONSTRAINT "album_purchases_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "album_purchases_user_idx" ON "album_purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "album_purchases_album_idx" ON "album_purchases" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "album_purchases_status_idx" ON "album_purchases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "album_purchases_user_album_idx" ON "album_purchases" USING btree ("user_id","album_id");