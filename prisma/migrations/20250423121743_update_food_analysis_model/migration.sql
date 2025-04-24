/*
  Warnings:

  - You are about to alter the column `calories` on the `FoodAnalysis` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "FoodAnalysis" ADD COLUMN     "dish" TEXT,
ADD COLUMN     "questions" JSONB,
ADD COLUMN     "warnings" TEXT,
ALTER COLUMN "photoUrl" DROP NOT NULL,
ALTER COLUMN "calories" SET DATA TYPE INTEGER;
