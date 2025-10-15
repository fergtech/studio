-- Add content moderation fields to GeneralPost, Issue, Idea models
-- Run this on production database

-- Add moderation fields to GeneralPost
ALTER TABLE "GeneralPost"
ADD COLUMN IF NOT EXISTS "moderationStatus" TEXT DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS "moderationFlags" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "moderationScore" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "moderationReasoning" TEXT;

-- Add moderation index to GeneralPost
CREATE INDEX IF NOT EXISTS "GeneralPost_moderationStatus_idx" ON "GeneralPost"("moderationStatus");

-- Add moderation fields to Issue
ALTER TABLE "Issue"
ADD COLUMN IF NOT EXISTS "moderationStatus" TEXT DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS "moderationFlags" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "moderationScore" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "moderationReasoning" TEXT;

-- Add moderation index to Issue
CREATE INDEX IF NOT EXISTS "Issue_moderationStatus_idx" ON "Issue"("moderationStatus");

-- Add moderation fields to Idea
ALTER TABLE "Idea"
ADD COLUMN IF NOT EXISTS "moderationStatus" TEXT DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS "moderationFlags" TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "moderationScore" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "moderationReasoning" TEXT;

-- Add moderation index to Idea
CREATE INDEX IF NOT EXISTS "Idea_moderationStatus_idx" ON "Idea"("moderationStatus");

-- Add admin/moderator roles to User
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "isModerator" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN DEFAULT FALSE;

-- Optional: Set yourself as admin (replace with your email)
-- UPDATE "User" SET "isAdmin" = TRUE, "isModerator" = TRUE WHERE email = 'your-email@example.com';
