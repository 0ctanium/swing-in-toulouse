CREATE TYPE "public"."integration_type" AS ENUM('agenda_embed');--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"type" "integration_type" DEFAULT 'agenda_embed' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"custom_domain" text,
	"custom_domain_status" "custom_domain_status" DEFAULT 'none' NOT NULL,
	"custom_domain_verified_at" timestamp with time zone,
	"custom_domain_added_at" timestamp with time zone,
	"theme" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "integrations_organization_slug_idx" ON "integrations" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "integrations_organization_id_idx" ON "integrations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "integrations_active_idx" ON "integrations" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "integrations_custom_domain_idx" ON "integrations" USING btree ("custom_domain") WHERE "integrations"."custom_domain" is not null;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "integrations_quota" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "organizations"
SET "integrations_quota" = 1
WHERE "custom_integrations_enabled" = true;--> statement-breakpoint
INSERT INTO "integrations" (
	"organization_id",
	"slug",
	"name",
	"type",
	"is_active",
	"custom_domain",
	"custom_domain_status",
	"custom_domain_verified_at",
	"custom_domain_added_at"
)
SELECT
	"id",
	'agenda',
	'Agenda',
	'agenda_embed',
	true,
	"custom_domain",
	"custom_domain_status",
	"custom_domain_verified_at",
	"custom_domain_added_at"
FROM "organizations"
WHERE "custom_integrations_enabled" = true;--> statement-breakpoint
DROP INDEX "organizations_custom_domain_idx";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "custom_integrations_enabled";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "custom_domain";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "custom_domain_status";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "custom_domain_verified_at";--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "custom_domain_added_at";
