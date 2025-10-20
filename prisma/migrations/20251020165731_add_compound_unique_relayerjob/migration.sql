/*
  Warnings:

  - A unique constraint covering the columns `[jobType,txHash]` on the table `RelayerJob` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RelayerJob_jobType_txHash_key" ON "RelayerJob"("jobType", "txHash");
