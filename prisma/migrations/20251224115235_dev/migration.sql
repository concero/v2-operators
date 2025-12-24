/*
  Warnings:

  - You are about to drop the `RelayerJob` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RelayerJob";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "job" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "messageId" TEXT NOT NULL,
    "validatorType" TEXT NOT NULL,
    "callbacksCount" INTEGER,
    "srcChainSelector" INTEGER NOT NULL,
    "srcBlockNumber" TEXT NOT NULL,
    "srcBlockNumberDelta" TEXT NOT NULL,
    "dstBlockNumber" TEXT,
    "dstChainSelector" INTEGER NOT NULL,
    "dstBlockNumberDelta" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "job_messageId_key" ON "job"("messageId");

-- CreateIndex
CREATE INDEX "job_nextRetryAt_idx" ON "job"("nextRetryAt");
