-- CreateTable
CREATE TABLE "logsListener_blockCheckpoints" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chainSelector" INTEGER NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "logsListener_blockCheckpoints_chainSelector_contractAddress_idx" ON "logsListener_blockCheckpoints"("chainSelector", "contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "logsListener_blockCheckpoints_chainSelector_contractAddress_key" ON "logsListener_blockCheckpoints"("chainSelector", "contractAddress");
