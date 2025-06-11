-- AlterTable
ALTER TABLE "Idea" ADD COLUMN     "championCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "championedById" TEXT;

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "championCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "championedById" TEXT;

-- AlterTable
ALTER TABLE "MediaItem" ADD COLUMN     "ideaId" TEXT,
ADD COLUMN     "issueId" TEXT;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_championedById_fkey" FOREIGN KEY ("championedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_championedById_fkey" FOREIGN KEY ("championedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
