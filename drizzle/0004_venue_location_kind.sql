DO $$ BEGIN
  CREATE TYPE "public"."venue_location_kind" AS ENUM('place', 'area', 'none');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "venues" ADD COLUMN IF NOT EXISTS "location_kind" "venue_location_kind" DEFAULT 'place' NOT NULL;
