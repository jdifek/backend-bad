/*
  Warnings:

  - A unique constraint covering the columns `[userId,date]` on the table `CaloriesBurned` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "CaloriesBurned_userId_date_idx";

-- CreateIndex
CREATE UNIQUE INDEX "CaloriesBurned_userId_date_key" ON "CaloriesBurned"("userId", "date");
