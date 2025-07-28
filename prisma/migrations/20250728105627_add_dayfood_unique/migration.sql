/*
  Warnings:

  - A unique constraint covering the columns `[date,foodId]` on the table `DayFood` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DayFood_date_foodId_key" ON "DayFood"("date", "foodId");
