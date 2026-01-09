/*
  Warnings:

  - You are about to drop the `Counter` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."Counter";

-- CreateTable
CREATE TABLE "public"."counter" (
    "type" "public"."CounterType" NOT NULL,
    "value" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "counter_type_key" ON "public"."counter"("type");

-- CreateIndex
CREATE INDEX "counter_type_idx" ON "public"."counter"("type");
