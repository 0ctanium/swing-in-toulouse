CREATE TABLE "event_occurrences" (
	"id" text PRIMARY KEY NOT NULL,
	"master_event_id" uuid NOT NULL,
	"series_start_at" timestamp with time zone NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"is_all_day" boolean DEFAULT false NOT NULL,
	"location_raw" text,
	"source_url" text,
	"url" text NOT NULL,
	"status" "event_status" NOT NULL,
	"categories" text[],
	"organization_id" uuid,
	"venue_id" uuid,
	"canonical_venue_id" uuid,
	"source_id" uuid NOT NULL,
	"is_overridden" boolean DEFAULT false NOT NULL,
	"materialized_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_master_event_id_events_id_fk" FOREIGN KEY ("master_event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_canonical_venue_id_venues_id_fk" FOREIGN KEY ("canonical_venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_occurrences_master_series_unique_idx" ON "event_occurrences" USING btree ("master_event_id","series_start_at");--> statement-breakpoint
CREATE INDEX "event_occurrences_start_at_idx" ON "event_occurrences" USING btree ("start_at");--> statement-breakpoint
CREATE INDEX "event_occurrences_published_start_at_idx" ON "event_occurrences" USING btree ("start_at") WHERE "status" = 'published';--> statement-breakpoint
CREATE INDEX "event_occurrences_canonical_venue_idx" ON "event_occurrences" USING btree ("canonical_venue_id");--> statement-breakpoint
CREATE INDEX "event_occurrences_organization_idx" ON "event_occurrences" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "event_occurrences_master_event_id_idx" ON "event_occurrences" USING btree ("master_event_id");--> statement-breakpoint
CREATE INDEX "event_occurrences_source_id_idx" ON "event_occurrences" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "event_occurrences_categories_gin_idx" ON "event_occurrences" USING gin ("categories");
