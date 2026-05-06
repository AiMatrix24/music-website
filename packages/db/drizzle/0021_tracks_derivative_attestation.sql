ALTER TABLE "tracks" ADD COLUMN "derivative_work" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "derivative_attestation" text;