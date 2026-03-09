-- Phase 2.7 Revision: Unify Scheduled & Recurring into ScheduledTransaction
-- This migration:
-- 1. Creates ScheduledTransaction (absorbs RecurringTransaction + PENDING Transactions)
-- 2. Migrates all RecurringTransaction rows → ScheduledTransaction
-- 3. Migrates all PENDING Transaction rows → ScheduledTransaction (frequency=ONCE)
-- 4. Updates Transaction.scheduledId from old recurringId
-- 5. Removes status, isRecurring, recurringId from Transaction
-- 6. Drops RecurringTransaction table
-- 7. Drops TransactionStatus and RecurringFrequency enums

-- CreateEnum
CREATE TYPE "ScheduleFrequency" AS ENUM ('ONCE', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "ScheduledTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "categoryId" TEXT NOT NULL,
    "necessityLevel" "NecessityLevel",
    "valueAlignment" "ValueAlignment",
    "frequency" "ScheduleFrequency" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "nextOccurrence" TIMESTAMP(3) NOT NULL,
    "notificationDaysBefore" INTEGER NOT NULL DEFAULT 3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastExecutedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledTransaction_pkey" PRIMARY KEY ("id")
);

-- MigrateData: RecurringTransaction → ScheduledTransaction
-- Maps: nextDueDate → nextOccurrence, lastCreatedDate → lastExecutedDate
-- RecurringFrequency values (WEEKLY/MONTHLY/YEARLY) cast directly to ScheduleFrequency
INSERT INTO "ScheduledTransaction" (
    "id", "userId", "amount", "description", "type", "categoryId",
    "necessityLevel", "valueAlignment", "frequency", "startDate", "endDate",
    "nextOccurrence", "notificationDaysBefore", "isActive", "lastExecutedDate",
    "notes", "createdAt", "updatedAt"
)
SELECT
    rt."id",
    rt."userId",
    rt."amount",
    rt."description",
    rt."type",
    rt."categoryId",
    rt."necessityLevel",
    rt."valueAlignment",
    rt."frequency"::text::"ScheduleFrequency",
    rt."startDate",
    rt."endDate",
    rt."nextDueDate",
    rt."notificationDaysBefore",
    rt."isActive",
    rt."lastCreatedDate",
    NULL,
    rt."createdAt",
    rt."updatedAt"
FROM "RecurringTransaction" rt;

-- MigrateData: PENDING Transactions → ScheduledTransaction (frequency=ONCE)
-- Uses the PENDING transaction's own id as the ScheduledTransaction id
INSERT INTO "ScheduledTransaction" (
    "id", "userId", "amount", "description", "type", "categoryId",
    "necessityLevel", "valueAlignment", "frequency", "startDate", "endDate",
    "nextOccurrence", "notificationDaysBefore", "isActive",
    "notes", "createdAt", "updatedAt"
)
SELECT
    t."id",
    t."userId",
    t."amount",
    t."description",
    t."type",
    t."categoryId",
    t."necessityLevel",
    t."valueAlignment",
    'ONCE'::"ScheduleFrequency",
    t."date",
    NULL,
    t."date",
    3,
    true,
    t."notes",
    t."createdAt",
    CURRENT_TIMESTAMP
FROM "Transaction" t
WHERE t."status" = 'PENDING';

-- AddColumn: scheduledId to Transaction (nullable)
ALTER TABLE "Transaction" ADD COLUMN "scheduledId" TEXT;

-- MigrateData: Update Transaction.scheduledId from old recurringId
UPDATE "Transaction" SET "scheduledId" = "recurringId" WHERE "recurringId" IS NOT NULL;

-- DeleteData: Remove PENDING Transaction rows (now in ScheduledTransaction)
DELETE FROM "Transaction" WHERE "status" = 'PENDING';

-- DropForeignKey: Transaction.recurringId → RecurringTransaction
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_recurringId_fkey";

-- DropIndex: Transaction.userId_status_date
DROP INDEX "Transaction_userId_status_date_idx";

-- AlterTable: Remove old columns from Transaction
ALTER TABLE "Transaction"
    DROP COLUMN "status",
    DROP COLUMN "isRecurring",
    DROP COLUMN "recurringId";

-- DropTable: RecurringTransaction (cascades its indices and FK constraints)
DROP TABLE "RecurringTransaction";

-- DropEnum
DROP TYPE "RecurringFrequency";
DROP TYPE "TransactionStatus";

-- CreateIndex: ScheduledTransaction
CREATE INDEX "ScheduledTransaction_userId_nextOccurrence_idx" ON "ScheduledTransaction"("userId", "nextOccurrence");
CREATE INDEX "ScheduledTransaction_userId_frequency_isActive_idx" ON "ScheduledTransaction"("userId", "frequency", "isActive");
CREATE INDEX "ScheduledTransaction_categoryId_idx" ON "ScheduledTransaction"("categoryId");

-- CreateIndex: Transaction.scheduledId
CREATE INDEX "Transaction_scheduledId_idx" ON "Transaction"("scheduledId");

-- AddForeignKey: ScheduledTransaction relations
ALTER TABLE "ScheduledTransaction" ADD CONSTRAINT "ScheduledTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduledTransaction" ADD CONSTRAINT "ScheduledTransaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Transaction.scheduledId
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_scheduledId_fkey" FOREIGN KEY ("scheduledId") REFERENCES "ScheduledTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
