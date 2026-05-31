CREATE TYPE "public"."event_category_tag_type" AS ENUM('danse', 'evenement', 'autre');
--> statement-breakpoint
CREATE TABLE "event_category_tags" (
	"name" text PRIMARY KEY NOT NULL,
	"tag_type" "event_category_tag_type" DEFAULT 'autre' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "event_category_tags_type_idx" ON "event_category_tags" USING btree ("tag_type");
