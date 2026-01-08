import { prisma } from '@/lib/db';
import {
  UpdateTransactionInput,
  UpdateTransactionSchema,
} from '@/lib/validations/transaction';
import { Transaction } from '@/types/transaction';

export async function updateTransaction(
  userId: string,
  transactionId: string,
  data: UpdateTransactionInput
): Promise<Transaction> {
  const validated = UpdateTransactionSchema.parse(data);

  // Verify exists and belongs to user
  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  });

  if (!existing) {
    throw new Error('Transaction not found');
  }

  // Business rules
  if (validated.amount && validated.amount <= 0) {
    throw new Error('Amount must be positive');
  }

  if (validated.date && validated.date > new Date()) {
    throw new Error('Date cannot be in the future');
  }

  const transaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: validated,
  });

  return transaction;
}
