ALTER TABLE "event_category_tags" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "event_category_tags" ADD COLUMN "subtitle" text;--> statement-breakpoint
ALTER TABLE "event_category_tags" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "event_category_tags" ADD COLUMN "seo_title" text;--> statement-breakpoint
ALTER TABLE "event_category_tags" ADD COLUMN "seo_description" text;--> statement-breakpoint
ALTER TABLE "event_category_tags" ADD COLUMN "is_published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "event_category_tags_slug_unique_idx" ON "event_category_tags" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "event_category_tags_published_idx" ON "event_category_tags" USING btree ("is_published","tag_type");
