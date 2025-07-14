-- CreateTable
CREATE TABLE "SocietyPost" (
    "id" TEXT NOT NULL,
    "societyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocietyPost_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SocietyPost" ADD CONSTRAINT "SocietyPost_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "Society"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocietyPost" ADD CONSTRAINT "SocietyPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
