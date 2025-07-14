-- AlterTable
ALTER TABLE "Initiative" ADD COLUMN     "showLocation" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "showLocation" BOOLEAN NOT NULL DEFAULT true;
