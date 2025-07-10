/*
  Warnings:

  - You are about to drop the `Story` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Story";

-- CreateTable
CREATE TABLE "story" (
    "id" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "story_pkey" PRIMARY KEY ("id")
);
