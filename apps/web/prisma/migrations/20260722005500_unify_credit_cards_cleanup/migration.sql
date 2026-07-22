-- Phase 6 cleanup migration: drop the standalone CreditCard table and
-- Transaction.creditCardId now that db:backfill-unify-credit-cards has
-- copied every CreditCard row into FinancialAccount (type=CREDIT_CARD,
-- same id) and remapped every Transaction.creditCardId onto accountId.
--
-- Safety check: refuse to run if the backfill hasn't completed, rather
-- than silently losing data.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "CreditCard" c
    WHERE NOT EXISTS (SELECT 1 FROM "FinancialAccount" a WHERE a.id = c.id)
  ) THEN
    RAISE EXCEPTION 'backfill incomplete: CreditCard rows without a matching FinancialAccount — run db:backfill-unify-credit-cards first';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "Transaction"
    WHERE "creditCardId" IS NOT NULL AND "accountId" IS NULL
  ) THEN
    RAISE EXCEPTION 'backfill incomplete: Transaction rows with unmigrated creditCardId — run db:backfill-unify-credit-cards first';
  END IF;
END $$;

-- DropForeignKey
ALTER TABLE "CreditCard" DROP CONSTRAINT "CreditCard_userId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_creditCardId_fkey";

-- DropIndex
DROP INDEX "Transaction_creditCardId_idx";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "creditCardId";

-- DropTable
DROP TABLE "CreditCard";
