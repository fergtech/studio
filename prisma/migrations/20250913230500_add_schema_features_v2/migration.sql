-- Add missing columns and relationships for new features (v2)

-- Add lastActiveAt to User table (fixes auth error)
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

-- Add foreign key constraints for Idea (conditional)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Idea_societyId_fkey' AND table_name = 'Idea'
    ) THEN
        ALTER TABLE "Idea" ADD CONSTRAINT "Idea_societyId_fkey" 
        FOREIGN KEY ("societyId") REFERENCES "Society"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Idea_addressingIssueId_fkey' AND table_name = 'Idea'
    ) THEN
        ALTER TABLE "Idea" ADD CONSTRAINT "Idea_addressingIssueId_fkey" 
        FOREIGN KEY ("addressingIssueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Idea_implementedAsInitiativeId_fkey' AND table_name = 'Idea'
    ) THEN
        ALTER TABLE "Idea" ADD CONSTRAINT "Idea_implementedAsInitiativeId_fkey" 
        FOREIGN KEY ("implementedAsInitiativeId") REFERENCES "Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints for Issue (conditional)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Issue_societyId_fkey' AND table_name = 'Issue'
    ) THEN
        ALTER TABLE "Issue" ADD CONSTRAINT "Issue_societyId_fkey" 
        FOREIGN KEY ("societyId") REFERENCES "Society"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Issue_addressedByInitiativeId_fkey' AND table_name = 'Issue'
    ) THEN
        ALTER TABLE "Issue" ADD CONSTRAINT "Issue_addressedByInitiativeId_fkey" 
        FOREIGN KEY ("addressedByInitiativeId") REFERENCES "Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Add foreign key constraints for Initiative (conditional)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Initiative_originatingIdeaId_fkey' AND table_name = 'Initiative'
    ) THEN
        ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_originatingIdeaId_fkey" 
        FOREIGN KEY ("originatingIdeaId") REFERENCES "Idea"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Initiative_originatingIssueId_fkey' AND table_name = 'Initiative'
    ) THEN
        ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_originatingIssueId_fkey" 
        FOREIGN KEY ("originatingIssueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Add unique indexes (conditional)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'Idea_implementedAsInitiativeId_key' AND n.nspname = 'public'
    ) THEN
        CREATE UNIQUE INDEX "Idea_implementedAsInitiativeId_key" ON "Idea"("implementedAsInitiativeId");
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'Issue_addressedByInitiativeId_key' AND n.nspname = 'public'
    ) THEN
        CREATE UNIQUE INDEX "Issue_addressedByInitiativeId_key" ON "Issue"("addressedByInitiativeId");
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'Initiative_originatingIdeaId_key' AND n.nspname = 'public'
    ) THEN
        CREATE UNIQUE INDEX "Initiative_originatingIdeaId_key" ON "Initiative"("originatingIdeaId");
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = 'Initiative_originatingIssueId_key' AND n.nspname = 'public'
    ) THEN
        CREATE UNIQUE INDEX "Initiative_originatingIssueId_key" ON "Initiative"("originatingIssueId");
    END IF;
END $$;