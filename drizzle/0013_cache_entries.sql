CREATE TABLE "cache_entries" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"ttl" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "cache_entries_ttl_idx" ON "cache_entries" USING btree ("ttl");
