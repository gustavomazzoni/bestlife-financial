-- AlterEnum
ALTER TYPE "FinancialAccountType" ADD VALUE 'CREDIT_CARD';

-- AlterTable
ALTER TABLE "FinancialAccount" ADD COLUMN     "closingDay" INTEGER,
ADD COLUMN     "creditLimit" DECIMAL(12,2),
ADD COLUMN     "dueDay" INTEGER;
