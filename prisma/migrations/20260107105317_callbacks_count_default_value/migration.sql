/*
  Warnings:

  - Made the column `callbacksCount` on table `job` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."job" ALTER COLUMN "callbacksCount" SET NOT NULL,
ALTER COLUMN "callbacksCount" SET DEFAULT 0;

-- CreateIndex
CREATE INDEX "job_dstChainSelector_idx" ON "public"."job"("dstChainSelector");

-- CreateIndex
CREATE INDEX "job_srcChainSelector_idx" ON "public"."job"("srcChainSelector");

-- CreateIndex
CREATE INDEX "job_messageId_idx" ON "public"."job"("messageId");

-- AddForeignKey
ALTER TABLE "public"."cre_callback" ADD CONSTRAINT "cre_callback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."job"("messageId") ON DELETE RESTRICT ON UPDATE CASCADE;
