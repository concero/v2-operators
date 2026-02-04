/*
  Warnings:

  - You are about to drop the column `dstBlockNumberDelta` on the `job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."job" DROP COLUMN "dstBlockNumberDelta",
ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "errorCode" TEXT;
