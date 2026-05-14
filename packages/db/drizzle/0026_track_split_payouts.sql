CREATE TYPE "public"."split_payout_status" AS ENUM('credited', 'escrowed', 'released', 'returned', 'clawed_back');--> statement-breakpoint
CREATE TABLE "track_split_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_type" text NOT NULL,
	"source_id" uuid NOT NULL,
	"track_id" uuid NOT NULL,
	"recipient_user_id" uuid NOT NULL,
	"track_split_id" uuid,
	"parent_payout_id" uuid,
	"split_type" "split_type" DEFAULT 'master' NOT NULL,
	"percent_bp" integer NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" "split_payout_status" DEFAULT 'credited' NOT NULL,
	"released_at" timestamp with time zone,
	"returned_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "track_split_payouts" ADD CONSTRAINT "track_split_payouts_track_id_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_split_payouts" ADD CONSTRAINT "track_split_payouts_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_split_payouts" ADD CONSTRAINT "track_split_payouts_track_split_id_track_splits_id_fk" FOREIGN KEY ("track_split_id") REFERENCES "public"."track_splits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "split_payouts_recipient_status_idx" ON "track_split_payouts" USING btree ("recipient_user_id","status");--> statement-breakpoint
CREATE INDEX "split_payouts_source_idx" ON "track_split_payouts" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "split_payouts_track_split_status_idx" ON "track_split_payouts" USING btree ("track_split_id","status");--> statement-breakpoint
CREATE INDEX "split_payouts_track_idx" ON "track_split_payouts" USING btree ("track_id");--> statement-breakpoint

-- Backfill: every completed track purchase gets an owner-take-all credited row.
-- Pre-existing purchases predate splits, so the full price routes to the track owner.
INSERT INTO "track_split_payouts" (source_type, source_id, track_id, recipient_user_id, track_split_id, split_type, percent_bp, amount_cents, status)
SELECT 'track_purchase', tp.id, tp.track_id, t.user_id, NULL, 'master', 10000, tp.price_paid, 'credited'
FROM track_purchases tp
JOIN tracks t ON t.id = tp.track_id
WHERE tp.status = 'completed'
AND NOT EXISTS (
  SELECT 1 FROM track_split_payouts p WHERE p.source_type = 'track_purchase' AND p.source_id = tp.id
);--> statement-breakpoint

-- Backfill: every completed tip with a track_id gets an owner-take-all credited row to the tip recipient.
INSERT INTO "track_split_payouts" (source_type, source_id, track_id, recipient_user_id, track_split_id, split_type, percent_bp, amount_cents, status)
SELECT 'tip', t.id, t.track_id, t.recipient_user_id, NULL, 'master', 10000, t.amount, 'credited'
FROM tips t
WHERE t.status = 'completed'
AND t.track_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM track_split_payouts p WHERE p.source_type = 'tip' AND p.source_id = t.id
);