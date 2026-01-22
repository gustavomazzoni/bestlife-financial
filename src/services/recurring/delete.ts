import { prisma } from '@/lib/db';

/**
 * Soft delete a recurring transaction by setting isActive = false.
 * This preserves the recurring transaction record and all created transactions.
 */
export async function deleteRecurringTransaction(
  userId: string,
  recurringId: string
): Promise<void> {
  // Verify exists and belongs to user
  const existing = await prisma.recurringTransaction.findFirst({
    where: { id: recurringId, userId },
  });

  if (!existing) {
    throw new Error('Recurring transaction not found');
  }

  if (!existing.isActive) {
    throw new Error('Recurring transaction is already inactive');
  }

  // Soft delete by setting isActive = false
  // This preserves created transaction instances
  await prisma.recurringTransaction.update({
    where: { id: recurringId },
    data: { isActive: false },
  });
}
