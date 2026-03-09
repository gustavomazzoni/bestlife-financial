import { prisma } from '@/lib/db';

/**
 * Delete a scheduled transaction.
 * - ONCE: hard delete (no execution history)
 * - RECURRING: soft delete (sets isActive = false, preserves transaction history)
 */
export async function deleteScheduledTransaction(
  userId: string,
  scheduledId: string
): Promise<void> {
  const existing = await prisma.scheduledTransaction.findFirst({
    where: { id: scheduledId, userId },
  });

  if (!existing) {
    throw new Error('Scheduled transaction not found');
  }

  if (existing.frequency === 'ONCE') {
    // Hard delete for one-time scheduled transactions
    await prisma.scheduledTransaction.delete({
      where: { id: scheduledId },
    });
  } else {
    // Soft delete for recurring transactions
    if (!existing.isActive) {
      throw new Error('Scheduled transaction is already inactive');
    }
    await prisma.scheduledTransaction.update({
      where: { id: scheduledId },
      data: { isActive: false },
    });
  }
}
