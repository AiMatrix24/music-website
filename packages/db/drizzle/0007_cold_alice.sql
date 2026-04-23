CREATE TYPE "public"."payout_request_status" AS ENUM('pending', 'processing', 'paid', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TABLE "payout_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"wallet_address" text NOT NULL,
	"status" "payout_request_status" DEFAULT 'pending' NOT NULL,
	"tx_hash" text,
	"notes" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payout_req_user_idx" ON "payout_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payout_req_status_idx" ON "payout_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payout_req_user_status_idx" ON "payout_requests" USING btree ("user_id","status");