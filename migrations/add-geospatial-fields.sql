-- Add latitude and longitude fields to all content tables for geospatial filtering

-- Add to Issue table
ALTER TABLE "Issue"
ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

-- Add to Idea table
ALTER TABLE "Idea"
ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

-- Add to Initiative table
ALTER TABLE "Initiative"
ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

-- Add to Society table
ALTER TABLE "Society"
ADD COLUMN IF NOT EXISTS "location" TEXT,
ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

-- Create indexes for better query performance on geospatial searches
CREATE INDEX IF NOT EXISTS "Issue_latitude_longitude_idx" ON "Issue"("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "Idea_latitude_longitude_idx" ON "Idea"("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "Initiative_latitude_longitude_idx" ON "Initiative"("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "Society_latitude_longitude_idx" ON "Society"("latitude", "longitude");
