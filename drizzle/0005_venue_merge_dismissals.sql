CREATE TABLE IF NOT EXISTS "venue_merge_dismissals" (
  "venue_id_a" uuid NOT NULL,
  "venue_id_b" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "venue_merge_dismissals_venue_id_a_venues_id_fk" FOREIGN KEY ("venue_id_a") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "venue_merge_dismissals_venue_id_b_venues_id_fk" FOREIGN KEY ("venue_id_b") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "venue_merge_dismissals_venue_id_a_venue_id_b_pk" PRIMARY KEY("venue_id_a","venue_id_b")
);

CREATE INDEX IF NOT EXISTS "venue_merge_dismissals_venue_id_a_idx" ON "venue_merge_dismissals" USING btree ("venue_id_a");
CREATE INDEX IF NOT EXISTS "venue_merge_dismissals_venue_id_b_idx" ON "venue_merge_dismissals" USING btree ("venue_id_b");
