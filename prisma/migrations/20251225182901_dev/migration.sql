-- CreateTable
CREATE TABLE "public"."logsListener_blockCheckpoints" (
    "id" SERIAL NOT NULL,
    "chainSelector" INTEGER NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logsListener_blockCheckpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job" (
    "id" SERIAL NOT NULL,
    "messageId" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "validatorType" TEXT NOT NULL,
    "callbacksCount" INTEGER,
    "status" TEXT NOT NULL,
    "srcTxHash" TEXT NOT NULL,
    "srcChainSelector" INTEGER NOT NULL,
    "srcBlockNumber" TEXT NOT NULL,
    "srcBlockNumberDelta" TEXT NOT NULL,
    "dstTxHash" TEXT,
    "dstChainSelector" INTEGER NOT NULL,
    "dstBlockNumber" TEXT,
    "dstBlockNumberDelta" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cre_callback" (
    "id" SERIAL NOT NULL,
    "messageId" TEXT NOT NULL,
    "payload" TEXT NOT NULL,

    CONSTRAINT "cre_callback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "logsListener_blockCheckpoints_chainSelector_contractAddress_idx" ON "public"."logsListener_blockCheckpoints"("chainSelector", "contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "logsListener_blockCheckpoints_chainSelector_contractAddress_key" ON "public"."logsListener_blockCheckpoints"("chainSelector", "contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "job_messageId_key" ON "public"."job"("messageId");

-- CreateIndex
CREATE INDEX "cre_callback_messageId_idx" ON "public"."cre_callback"("messageId");
