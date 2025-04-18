/*
  Warnings:

  - You are about to drop the column `telegram` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[telegramId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `telegramId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_telegram_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "telegram",
ADD COLUMN     "telegramId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
