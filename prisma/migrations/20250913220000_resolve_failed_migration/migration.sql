-- Resolve failed migration state and apply schema changes
-- This migration resolves the failed migration and applies all necessary schema changes

-- First, add the critical lastActiveAt column that's causing the auth error
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

-- Add foreign key constraints safely (ignore if they already exist or fail)
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE "Idea" ADD CONSTRAINT "Idea_societyId_fkey" 
        FOREIGN KEY ("societyId") REFERENCES "Society"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint already exists, ignore
        NULL;
    END;
    
    BEGIN
        ALTER TABLE "Idea" ADD CONSTRAINT "Idea_addressingIssueId_fkey" 
        FOREIGN KEY ("addressingIssueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE "Idea" ADD CONSTRAINT "Idea_implementedAsInitiativeId_fkey" 
        FOREIGN KEY ("implementedAsInitiativeId") REFERENCES "Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE "Issue" ADD CONSTRAINT "Issue_societyId_fkey" 
        FOREIGN KEY ("societyId") REFERENCES "Society"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE "Issue" ADD CONSTRAINT "Issue_addressedByInitiativeId_fkey" 
        FOREIGN KEY ("addressedByInitiativeId") REFERENCES "Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_originatingIdeaId_fkey" 
        FOREIGN KEY ("originatingIdeaId") REFERENCES "Idea"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_originatingIssueId_fkey" 
        FOREIGN KEY ("originatingIssueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- Add unique indexes safely
DO $$
BEGIN
    BEGIN
        CREATE UNIQUE INDEX "Idea_implementedAsInitiativeId_key" ON "Idea"("implementedAsInitiativeId");
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;
    
    BEGIN
        CREATE UNIQUE INDEX "Issue_addressedByInitiativeId_key" ON "Issue"("addressedByInitiativeId");
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;
    
    BEGIN
        CREATE UNIQUE INDEX "Initiative_originatingIdeaId_key" ON "Initiative"("originatingIdeaId");
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;
    
    BEGIN
        CREATE UNIQUE INDEX "Initiative_originatingIssueId_key" ON "Initiative"("originatingIssueId");
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;
END $$;