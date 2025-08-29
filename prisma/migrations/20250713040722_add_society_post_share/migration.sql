-- CreateTable
CREATE TABLE "SocietyPostShare" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocietyPostShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocietyPostShare_postId_userId_key" ON "SocietyPostShare"("postId", "userId");

-- AddForeignKey
ALTER TABLE "SocietyPostShare" ADD CONSTRAINT "SocietyPostShare_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocietyPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocietyPostShare" ADD CONSTRAINT "SocietyPostShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
