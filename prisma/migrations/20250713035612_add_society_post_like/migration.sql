-- CreateTable
CREATE TABLE "SocietyPostLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocietyPostLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocietyPostLike_postId_userId_key" ON "SocietyPostLike"("postId", "userId");

-- AddForeignKey
ALTER TABLE "SocietyPostLike" ADD CONSTRAINT "SocietyPostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocietyPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocietyPostLike" ADD CONSTRAINT "SocietyPostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
