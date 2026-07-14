/*
  Warnings:

  - You are about to drop the column `isSystemDefault` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Category` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,type]` on the table `Category` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_userId_fkey";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "isSystemDefault",
DROP COLUMN "userId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "icon" TEXT NOT NULL DEFAULT '📊';

-- CreateIndex
CREATE INDEX "Category_type_idx" ON "Category"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_type_key" ON "Category"("name", "type");
