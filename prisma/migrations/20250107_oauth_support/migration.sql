-- AlterTable: Make passwordHash optional for OAuth users
-- This allows users to sign in with Google/Apple OAuth without having a password

ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN "User"."passwordHash" IS 'Password hash for email/password authentication. NULL for OAuth-only users (Google, Apple, etc.)';
