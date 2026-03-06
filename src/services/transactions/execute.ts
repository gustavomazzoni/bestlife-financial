import { startOfDay } from 'date-fns';
import { prisma } from '@/lib/db';
import { Transaction } from '@/types/transaction';

/**
 * Execute a PENDING transaction by marking it as EXECUTED.
 * Updates the date to today if the transaction was future-dated.
 */
export async function executeTransaction(
  userId: string,
  transactionId: string
): Promise<Transaction> {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (transaction.status === 'EXECUTED') {
    throw new Error('Transaction is already executed');
  }

  const today = startOfDay(new Date());

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status: 'EXECUTED',
      date: today,
    },
  });

  return updated;
}
