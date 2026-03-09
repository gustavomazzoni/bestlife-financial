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

  const transaction = await prisma.transaction.create({
    data: {
      ...data,
      userId,
    },
  });

  return transaction;
}
