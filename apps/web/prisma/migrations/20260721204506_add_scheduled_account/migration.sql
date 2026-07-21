-- AlterTable
ALTER TABLE "ScheduledTransaction" ADD COLUMN     "accountId" TEXT;

-- CreateIndex
CREATE INDEX "ScheduledTransaction_accountId_idx" ON "ScheduledTransaction"("accountId");

-- AddForeignKey
ALTER TABLE "ScheduledTransaction" ADD CONSTRAINT "ScheduledTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinancialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
