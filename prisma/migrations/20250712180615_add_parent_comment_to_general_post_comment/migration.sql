-- AlterTable
ALTER TABLE "GeneralPostComment" ADD COLUMN     "parentCommentId" TEXT;

-- AddForeignKey
ALTER TABLE "GeneralPostComment" ADD CONSTRAINT "GeneralPostComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "GeneralPostComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
