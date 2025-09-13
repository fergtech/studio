-- Add missing columns and relationships for new features

-- Add lastActiveAt to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3);

-- Add society relationships to Idea table
ALTER TABLE "Idea" ADD COLUMN IF NOT EXISTS "societyId" TEXT;
ALTER TABLE "Idea" ADD COLUMN IF NOT EXISTS "addressingIssueId" TEXT;
ALTER TABLE "Idea" ADD COLUMN IF NOT EXISTS "implementedAsInitiativeId" TEXT;

-- Add society relationship to Issue table  
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "societyId" TEXT;
ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "addressedByInitiativeId" TEXT;

-- Add originating relationships to Initiative table
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "originatingIdeaId" TEXT;
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "originatingIssueId" TEXT;

-- Add foreign key constraints for Idea (skip if exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Idea_societyId_fkey') THEN
        ALTER TABLE "Idea" ADD CONSTRAINT "Idea_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "Society"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Idea_addressingIssueId_fkey') THEN
        ALTER TABLE "Idea" ADD CONSTRAINT "Idea_addressingIssueId_fkey" FOREIGN KEY ("addressingIssueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Idea_implementedAsInitiativeId_fkey') THEN
        ALTER TABLE "Idea" ADD CONSTRAINT "Idea_implementedAsInitiativeId_fkey" FOREIGN KEY ("implementedAsInitiativeId") REFERENCES "Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints for Issue (skip if exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Issue_societyId_fkey') THEN
        ALTER TABLE "Issue" ADD CONSTRAINT "Issue_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "Society"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Issue_addressedByInitiativeId_fkey') THEN
        ALTER TABLE "Issue" ADD CONSTRAINT "Issue_addressedByInitiativeId_fkey" FOREIGN KEY ("addressedByInitiativeId") REFERENCES "Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints for Initiative (skip if exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Initiative_originatingIdeaId_fkey') THEN
        ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_originatingIdeaId_fkey" FOREIGN KEY ("originatingIdeaId") REFERENCES "Idea"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Initiative_originatingIssueId_fkey') THEN
        ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_originatingIssueId_fkey" FOREIGN KEY ("originatingIssueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Add unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "Idea_implementedAsInitiativeId_key" ON "Idea"("implementedAsInitiativeId");
CREATE UNIQUE INDEX IF NOT EXISTS "Issue_addressedByInitiativeId_key" ON "Issue"("addressedByInitiativeId");
CREATE UNIQUE INDEX IF NOT EXISTS "Initiative_originatingIdeaId_key" ON "Initiative"("originatingIdeaId");
CREATE UNIQUE INDEX IF NOT EXISTS "Initiative_originatingIssueId_key" ON "Initiative"("originatingIssueId");