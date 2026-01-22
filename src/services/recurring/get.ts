import { prisma } from '@/lib/db';
import { RecurringTransaction } from '@/types';

export async function getRecurringTransaction(
  userId: string,
  recurringId: string
): Promise<RecurringTransaction> {
  const recurring = await prisma.recurringTransaction.findFirst({
    where: { id: recurringId, userId },
    include: { category: true },
  });

  if (!recurring) {
    throw new Error('Recurring transaction not found');
  }

  return recurring;
}
