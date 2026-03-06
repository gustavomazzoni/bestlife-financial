import { startOfDay } from 'date-fns';
import { prisma } from '@/lib/db';
import { CreateTransactionInput } from '@/lib/validations/transaction';
import { Transaction } from '@/types/transaction';

export async function createTransaction(
  userId: string,
  data: CreateTransactionInput
): Promise<Transaction> {
  // Verify category exists and matches type
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId, type: data.type },
  });

  if (!category) {
    throw new Error('Invalid category');
  }

  // Auto-derive status if not provided: future dates → PENDING, today/past → EXECUTED
  const status =
    data.status ??
    (data.date > startOfDay(new Date()) ? 'PENDING' : 'EXECUTED');

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      ...data,
      status,
      userId,
    },
  });

  return transaction;
}
