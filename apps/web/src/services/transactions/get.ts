import { prisma } from '@/lib/db';
import { Transaction } from '@/types/transaction';

export async function getTransaction(
  userId: string,
  transactionId: string
): Promise<Transaction> {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  return transaction;
}
