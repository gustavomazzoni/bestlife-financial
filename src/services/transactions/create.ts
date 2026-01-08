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

  // Check if category exists
  const categoryExists = await prisma.category.findFirst({
    where: {
      name: validated.category,
      type: validated.type,
    },
  });

  if (!categoryExists) {
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
