CREATE TABLE "track_similarities" (
	"track_a_id" uuid NOT NULL,
	"track_b_id" uuid NOT NULL,
	"score" real NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "track_similarities_track_a_id_track_b_id_pk" PRIMARY KEY("track_a_id","track_b_id")
);
--> statement-breakpoint
ALTER TABLE "track_similarities" ADD CONSTRAINT "track_similarities_track_a_id_tracks_id_fk" FOREIGN KEY ("track_a_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_similarities" ADD CONSTRAINT "track_similarities_track_b_id_tracks_id_fk" FOREIGN KEY ("track_b_id") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "track_similarities_a_score_idx" ON "track_similarities" USING btree ("track_a_id","score");