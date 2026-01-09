/*
  Warnings:

  - You are about to drop the column `category` on the `PurchaseConsideration` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `RecurringTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `PurchaseConsideration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `RecurringTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Transaction_userId_category_idx";

-- AlterTable
ALTER TABLE "PurchaseConsideration" DROP COLUMN "category",
ADD COLUMN     "categoryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "RecurringTransaction" DROP COLUMN "category",
ADD COLUMN     "categoryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "category",
ADD COLUMN     "categoryId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "PurchaseConsideration_categoryId_idx" ON "PurchaseConsideration"("categoryId");

-- CreateIndex
CREATE INDEX "RecurringTransaction_categoryId_idx" ON "RecurringTransaction"("categoryId");

-- CreateIndex
CREATE INDEX "Transaction_userId_categoryId_idx" ON "Transaction"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "Transaction_categoryId_idx" ON "Transaction"("categoryId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTransaction" ADD CONSTRAINT "RecurringTransaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseConsideration" ADD CONSTRAINT "PurchaseConsideration_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
