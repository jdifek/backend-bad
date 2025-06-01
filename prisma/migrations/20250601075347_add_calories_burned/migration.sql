-- CreateTable
CREATE TABLE "CaloriesBurned" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calories" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaloriesBurned_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CaloriesBurned_userId_date_idx" ON "CaloriesBurned"("userId", "date");

-- AddForeignKey
ALTER TABLE "CaloriesBurned" ADD CONSTRAINT "CaloriesBurned_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
