ALTER TYPE "public"."source_type" ADD VALUE 'ical-file';--> statement-breakpoint
ALTER TABLE "sources" ALTER COLUMN "url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "ical_blob_url" text;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "ical_file_name" text;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "ical_file_size" integer;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "ical_content_hash" text;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "ical_uploaded_at" timestamp with time zone;
