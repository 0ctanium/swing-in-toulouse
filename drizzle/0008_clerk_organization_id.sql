ALTER TABLE "organizations" ADD COLUMN "clerk_organization_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_clerk_organization_id_unique" ON "organizations" USING btree ("clerk_organization_id");--> statement-breakpoint
CREATE INDEX "organizations_clerk_organization_id_idx" ON "organizations" USING btree ("clerk_organization_id");
