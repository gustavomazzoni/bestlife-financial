-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'EXECUTED');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'EXECUTED';

-- CreateIndex
CREATE INDEX "Transaction_userId_status_date_idx" ON "Transaction"("userId", "status", "date");
