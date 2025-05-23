/*
  Warnings:

  - You are about to drop the `_UserParticipatingInitiatives` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "InitiativeRoleType" AS ENUM ('ADMIN', 'MEMBER', 'CONTRIBUTOR', 'GUEST', 'SPONSOR', 'MENTOR');

-- DropForeignKey
ALTER TABLE "_UserParticipatingInitiatives" DROP CONSTRAINT "_UserParticipatingInitiatives_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserParticipatingInitiatives" DROP CONSTRAINT "_UserParticipatingInitiatives_B_fkey";

-- DropTable
DROP TABLE "_UserParticipatingInitiatives";

-- CreateTable
CREATE TABLE "InitiativeMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "role" "InitiativeRoleType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InitiativeMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InitiativeMembership_userId_initiativeId_key" ON "InitiativeMembership"("userId", "initiativeId");

-- AddForeignKey
ALTER TABLE "InitiativeMembership" ADD CONSTRAINT "InitiativeMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeMembership" ADD CONSTRAINT "InitiativeMembership_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
