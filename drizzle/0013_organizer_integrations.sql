CREATE TYPE "public"."custom_domain_status" AS ENUM('none', 'pending', 'verified', 'failed');--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "custom_integrations_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "custom_domain" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "custom_domain_status" "custom_domain_status" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "custom_domain_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "custom_domain_added_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_custom_domain_idx" ON "organizations" USING btree ("custom_domain") WHERE "organizations"."custom_domain" is not null;
