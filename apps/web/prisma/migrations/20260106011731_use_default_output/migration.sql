-- CreateEnum
CREATE TYPE "RecurringFrequency" AS ENUM ('WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "ConsiderationDecision" AS ENUM ('PURCHASED', 'SAVED_FOR_LATER', 'PASSED', 'PENDING');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "isSystemDefault" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "recurringId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'BRL',
ADD COLUMN     "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dailyReminderTime" TEXT NOT NULL DEFAULT '21:00',
ADD COLUMN     "gamificationEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hourlyRate" DECIMAL(10,2),
ADD COLUMN     "level" TEXT NOT NULL DEFAULT 'BEGINNER',
ADD COLUMN     "longestStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "notificationEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notificationPush" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "purchaseCheckThreshold" DECIMAL(10,2) NOT NULL DEFAULT 100,
ADD COLUMN     "weeklyReviewDay" TEXT NOT NULL DEFAULT 'SUNDAY',
ADD COLUMN     "weeklyReviewTime" TEXT NOT NULL DEFAULT '18:00';

-- CreateTable
CREATE TABLE "RecurringTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "category" TEXT NOT NULL,
    "necessityLevel" "NecessityLevel",
    "valueAlignment" "ValueAlignment",
    "frequency" "RecurringFrequency" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "notificationDaysBefore" INTEGER NOT NULL DEFAULT 3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastCreatedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseConsideration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2) NOT NULL,
    "category" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "alignmentResponses" JSONB NOT NULL,
    "decision" "ConsiderationDecision" NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseConsideration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Badge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeType" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringTransaction_userId_nextDueDate_idx" ON "RecurringTransaction"("userId", "nextDueDate");

-- CreateIndex
CREATE INDEX "RecurringTransaction_userId_isActive_idx" ON "RecurringTransaction"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseConsideration_transactionId_key" ON "PurchaseConsideration"("transactionId");

-- CreateIndex
CREATE INDEX "PurchaseConsideration_userId_date_idx" ON "PurchaseConsideration"("userId", "date");

-- CreateIndex
CREATE INDEX "PurchaseConsideration_userId_decision_idx" ON "PurchaseConsideration"("userId", "decision");

-- CreateIndex
CREATE INDEX "Badge_userId_earnedAt_idx" ON "Badge"("userId", "earnedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Badge_userId_badgeType_key" ON "Badge"("userId", "badgeType");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Transaction_userId_type_idx" ON "Transaction"("userId", "type");

-- CreateIndex
CREATE INDEX "Transaction_userId_category_idx" ON "Transaction"("userId", "category");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_recurringId_fkey" FOREIGN KEY ("recurringId") REFERENCES "RecurringTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTransaction" ADD CONSTRAINT "RecurringTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseConsideration" ADD CONSTRAINT "PurchaseConsideration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Badge" ADD CONSTRAINT "Badge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
