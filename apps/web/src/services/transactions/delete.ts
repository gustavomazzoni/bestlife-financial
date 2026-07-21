import { prisma } from '@/lib/db';
import { reconcileLedgerEffect } from './ledger';

export async function deleteTransaction(
  userId: string,
  transactionId: string
): Promise<void> {
  await prisma.$transaction(async tx => {
    const existing = await tx.transaction.findFirst({
      where: { id: transactionId, userId },
    });

    if (!existing) {
      throw new Error('Transaction not found');
    }

    await reconcileLedgerEffect(tx, existing, null);

    await tx.transaction.delete({
      where: { id: transactionId },
    });
  });
}
