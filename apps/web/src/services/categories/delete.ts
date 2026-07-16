import { prisma } from '@/lib/db';

/**
 * Categories are shared/global (no owning user), so unlike other delete
 * services this doesn't scope by userId — only whether the category is a
 * protected system default, and whether anything still references it.
 * Transaction/ScheduledTransaction/PurchaseConsideration all have a
 * required, non-cascading relation to Category, so deleting one still in
 * use would otherwise fail with a raw FK violation — checked explicitly
 * here for a clear error instead.
 */
export async function deleteCategory(categoryId: string): Promise<void> {
  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!existing) {
    throw new Error('Category not found');
  }

  if (existing.isSystemDefault) {
    throw new Error('Forbidden: system default categories cannot be modified');
  }

  const [transactionCount, scheduledCount, considerationCount] =
    await Promise.all([
      prisma.transaction.count({ where: { categoryId } }),
      prisma.scheduledTransaction.count({ where: { categoryId } }),
      prisma.purchaseConsideration.count({ where: { categoryId } }),
    ]);

  if (transactionCount > 0 || scheduledCount > 0 || considerationCount > 0) {
    throw new Error('Conflict: category is in use and cannot be deleted');
  }

  await prisma.category.delete({ where: { id: categoryId } });
}
