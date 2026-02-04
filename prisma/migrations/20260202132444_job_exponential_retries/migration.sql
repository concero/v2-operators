/*
  Warnings:

  - You are about to drop the column `lastSubmittedAt` on the `job` table. All the data in the column will be lost.
  - You are about to drop the column `lastVerificationRequestedAt` on the `job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."job" DROP COLUMN "lastSubmittedAt",
DROP COLUMN "lastVerificationRequestedAt",
ADD COLUMN     "lastSubmitAt" TIMESTAMP(3),
ADD COLUMN     "lastVerificationAt" TIMESTAMP(3),
ADD COLUMN     "submitAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "submitPlannedTo" TIMESTAMP(3),
ADD COLUMN     "verificationAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "verificationPlannedTo" TIMESTAMP(3);
