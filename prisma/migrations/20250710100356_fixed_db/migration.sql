/*
  Warnings:

  - Made the column `userId` on table `Story` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Story" ALTER COLUMN "userId" SET NOT NULL;
