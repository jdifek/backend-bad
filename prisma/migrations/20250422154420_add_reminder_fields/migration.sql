-- AlterTable
ALTER TABLE "Reminder" ADD COLUMN     "status" TEXT,
ADD COLUMN     "surveyResponse" TEXT,
ADD COLUMN     "type" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastMessage" TEXT;
