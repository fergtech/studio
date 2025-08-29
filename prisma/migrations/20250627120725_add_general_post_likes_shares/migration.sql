-- CreateTable
CREATE TABLE "GeneralPostLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneralPostLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneralPostShare" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneralPostShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GeneralPostLike_postId_userId_key" ON "GeneralPostLike"("postId", "userId");

-- AddForeignKey
ALTER TABLE "GeneralPostLike" ADD CONSTRAINT "GeneralPostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "GeneralPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralPostLike" ADD CONSTRAINT "GeneralPostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralPostShare" ADD CONSTRAINT "GeneralPostShare_postId_fkey" FOREIGN KEY ("postId") REFERENCES "GeneralPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralPostShare" ADD CONSTRAINT "GeneralPostShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
