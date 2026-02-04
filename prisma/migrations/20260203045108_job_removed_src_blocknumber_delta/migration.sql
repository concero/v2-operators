/*
  Warnings:

  - You are about to drop the column `srcBlockNumberDelta` on the `job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."job" DROP COLUMN "srcBlockNumberDelta";
