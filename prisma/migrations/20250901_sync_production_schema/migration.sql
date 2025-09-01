-- Add missing columns to SocietyPost table
ALTER TABLE "public"."SocietyPost" ADD COLUMN IF NOT EXISTS "linkUrl" TEXT;
ALTER TABLE "public"."SocietyPost" ADD COLUMN IF NOT EXISTS "linkPreviewId" TEXT;

-- Add missing columns to GeneralPost table  
ALTER TABLE "public"."GeneralPost" ADD COLUMN IF NOT EXISTS "linkUrl" TEXT;
ALTER TABLE "public"."GeneralPost" ADD COLUMN IF NOT EXISTS "linkPreviewId" TEXT;

-- Add missing columns to Initiative table
ALTER TABLE "public"."Initiative" ADD COLUMN IF NOT EXISTS "societyId" TEXT;

-- Create missing enums
DO $$ BEGIN
    CREATE TYPE "public"."DebateSide" AS ENUM ('PRO', 'CON');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create missing tables
CREATE TABLE IF NOT EXISTS "public"."LinkPreview" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "image" TEXT,
    "siteName" TEXT,
    "favicon" TEXT,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LinkPreview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."Document" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "extension" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."SocietyPostLink" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "linkPreviewId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocietyPostLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."GeneralPostLink" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "linkPreviewId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GeneralPostLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."SocietyPostDocument" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SocietyPostDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."GeneralPostDocument" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GeneralPostDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."DebateTopic" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DebateTopic_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."DebateVote" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "side" "public"."DebateSide" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DebateVote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."DebateArgument" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "side" "public"."DebateSide" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentId" TEXT,
    CONSTRAINT "DebateArgument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."DebateArgumentVote" (
    "id" TEXT NOT NULL,
    "argumentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isUpvote" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DebateArgumentVote_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "LinkPreview_url_key" ON "public"."LinkPreview"("url");
CREATE UNIQUE INDEX IF NOT EXISTS "Document_url_key" ON "public"."Document"("url");
CREATE UNIQUE INDEX IF NOT EXISTS "SocietyPostLink_postId_linkPreviewId_key" ON "public"."SocietyPostLink"("postId", "linkPreviewId");
CREATE UNIQUE INDEX IF NOT EXISTS "GeneralPostLink_postId_linkPreviewId_key" ON "public"."GeneralPostLink"("postId", "linkPreviewId");
CREATE UNIQUE INDEX IF NOT EXISTS "SocietyPostDocument_postId_documentId_key" ON "public"."SocietyPostDocument"("postId", "documentId");
CREATE UNIQUE INDEX IF NOT EXISTS "GeneralPostDocument_postId_documentId_key" ON "public"."GeneralPostDocument"("postId", "documentId");
CREATE UNIQUE INDEX IF NOT EXISTS "DebateVote_topicId_userId_key" ON "public"."DebateVote"("topicId", "userId");
CREATE UNIQUE INDEX IF NOT EXISTS "DebateArgumentVote_argumentId_userId_key" ON "public"."DebateArgumentVote"("argumentId", "userId");

-- Create regular indexes  
CREATE INDEX IF NOT EXISTS "SocietyPostLink_postId_order_idx" ON "public"."SocietyPostLink"("postId", "order");
CREATE INDEX IF NOT EXISTS "GeneralPostLink_postId_order_idx" ON "public"."GeneralPostLink"("postId", "order");
CREATE INDEX IF NOT EXISTS "SocietyPostDocument_postId_order_idx" ON "public"."SocietyPostDocument"("postId", "order");
CREATE INDEX IF NOT EXISTS "GeneralPostDocument_postId_order_idx" ON "public"."GeneralPostDocument"("postId", "order");

-- Add foreign key constraints (only if they don't exist)
DO $$ BEGIN
    ALTER TABLE "public"."SocietyPost" ADD CONSTRAINT "SocietyPost_linkPreviewId_fkey" FOREIGN KEY ("linkPreviewId") REFERENCES "public"."LinkPreview"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."GeneralPost" ADD CONSTRAINT "GeneralPost_linkPreviewId_fkey" FOREIGN KEY ("linkPreviewId") REFERENCES "public"."LinkPreview"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."Initiative" ADD CONSTRAINT "Initiative_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "public"."Society"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."SocietyPostLink" ADD CONSTRAINT "SocietyPostLink_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."SocietyPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."SocietyPostLink" ADD CONSTRAINT "SocietyPostLink_linkPreviewId_fkey" FOREIGN KEY ("linkPreviewId") REFERENCES "public"."LinkPreview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."GeneralPostLink" ADD CONSTRAINT "GeneralPostLink_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."GeneralPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."GeneralPostLink" ADD CONSTRAINT "GeneralPostLink_linkPreviewId_fkey" FOREIGN KEY ("linkPreviewId") REFERENCES "public"."LinkPreview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."SocietyPostDocument" ADD CONSTRAINT "SocietyPostDocument_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."SocietyPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."SocietyPostDocument" ADD CONSTRAINT "SocietyPostDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."GeneralPostDocument" ADD CONSTRAINT "GeneralPostDocument_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."GeneralPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."GeneralPostDocument" ADD CONSTRAINT "GeneralPostDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."DebateTopic" ADD CONSTRAINT "DebateTopic_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."DebateVote" ADD CONSTRAINT "DebateVote_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."DebateTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."DebateVote" ADD CONSTRAINT "DebateVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."DebateArgument" ADD CONSTRAINT "DebateArgument_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."DebateTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."DebateArgument" ADD CONSTRAINT "DebateArgument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."DebateArgument" ADD CONSTRAINT "DebateArgument_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."DebateArgument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."DebateArgumentVote" ADD CONSTRAINT "DebateArgumentVote_argumentId_fkey" FOREIGN KEY ("argumentId") REFERENCES "public"."DebateArgument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "public"."DebateArgumentVote" ADD CONSTRAINT "DebateArgumentVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;