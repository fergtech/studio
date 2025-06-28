/*
  Warnings:

  - You are about to drop the column `ownerAvatar` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `ownerName` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `Update` table. All the data in the column will be lost.
  - You are about to drop the column `userName` on the `Update` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `userId` on table `Update` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Update" DROP CONSTRAINT "Update_userId_fkey";

-- AlterTable
ALTER TABLE "Goal" DROP COLUMN "ownerAvatar",
DROP COLUMN "ownerName",
DROP COLUMN "progress",
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "ownerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Update" DROP COLUMN "timestamp",
DROP COLUMN "userName",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "goalId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "gender" TEXT,
ADD COLUMN     "username" TEXT,
ADD COLUMN     "websites" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Update" ADD CONSTRAINT "Update_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Update" ADD CONSTRAINT "Update_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
