-- CreateTable
CREATE TABLE "SocietyPostComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentCommentId" TEXT,

    CONSTRAINT "SocietyPostComment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SocietyPostComment" ADD CONSTRAINT "SocietyPostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocietyPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocietyPostComment" ADD CONSTRAINT "SocietyPostComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocietyPostComment" ADD CONSTRAINT "SocietyPostComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "SocietyPostComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
