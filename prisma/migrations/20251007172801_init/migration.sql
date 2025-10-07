-- CreateTable
CREATE TABLE "logsListenerBlockCheckpoints" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "chainSelector" INTEGER NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "logsListenerBlockCheckpoints_chainSelector_contractAddress_idx" ON "logsListenerBlockCheckpoints"("chainSelector", "contractAddress");

-- CreateIndex
CREATE UNIQUE INDEX "logsListenerBlockCheckpoints_chainSelector_contractAddress_key" ON "logsListenerBlockCheckpoints"("chainSelector", "contractAddress");
