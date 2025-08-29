/*
  Warnings:

  - A unique constraint covering the columns `[postId,userId]` on the table `GeneralPostShare` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "GeneralPostComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneralPostComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GeneralPostShare_postId_userId_key" ON "GeneralPostShare"("postId", "userId");

-- AddForeignKey
ALTER TABLE "GeneralPostComment" ADD CONSTRAINT "GeneralPostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "GeneralPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralPostComment" ADD CONSTRAINT "GeneralPostComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
