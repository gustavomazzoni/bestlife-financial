import { prisma } from '@/lib/db';
import { UpdateTransactionInput } from '@/lib/validations/transaction';
import { Transaction } from '@/types/transaction';

export async function updateTransaction(
  userId: string,
  transactionId: string,
  data: UpdateTransactionInput
): Promise<Transaction> {
  // Verify exists and belongs to user
  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  });

  if (!existing) {
    throw new Error('Transaction not found');
  }

  const transaction = await prisma.transaction.update({
    where: { id: transactionId },
    data,
  });

  return transaction;
}
