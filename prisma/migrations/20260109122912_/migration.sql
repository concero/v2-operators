-- CreateEnum
CREATE TYPE "public"."CounterType" AS ENUM ('creBufferSize');

-- CreateTable
CREATE TABLE "public"."Counter" (
    "type" "public"."CounterType" NOT NULL,
    "value" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Counter_type_key" ON "public"."Counter"("type");

-- CreateIndex
CREATE INDEX "Counter_type_idx" ON "public"."Counter"("type");
