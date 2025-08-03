/*
  Warnings:

  - A unique constraint covering the columns `[shortName]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shortName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "shortName" TEXT NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_shortName_key" ON "User"("shortName");
