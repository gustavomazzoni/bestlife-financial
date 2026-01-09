import { prisma } from '@/lib/db';
import {
  CreateTransactionInput,
  CreateTransactionSchema,
} from '@/lib/validations/transaction';
import { Transaction } from '@/types/transaction';

export async function createTransaction(
  userId: string,
  data: CreateTransactionInput
): Promise<Transaction> {
  // Validate
  const validated = CreateTransactionSchema.parse(data);

  // Verify category exists and matches type
  const category = await prisma.category.findUnique({
    where: { id: validated.categoryId, type: validated.type },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      ...validated,
      userId,
    },
  });

  return transaction;
}
