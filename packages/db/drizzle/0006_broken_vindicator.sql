ALTER TABLE "commissions" ALTER COLUMN "attribution_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "source_type" text;--> statement-breakpoint
ALTER TABLE "commissions" ADD COLUMN "source_id" uuid;--> statement-breakpoint
CREATE INDEX "comm_source_idx" ON "commissions" USING btree ("source_type","source_id");