import { prisma } from '@/lib/db';

export async function deleteTransaction(
  userId: string,
  transactionId: string
): Promise<void> {
  const existing = await prisma.transaction.findFirst({
    where: { id: transactionId, userId },
  });

  if (!existing) {
    throw new Error('Transaction not found');
  }

  await prisma.transaction.delete({
    where: { id: transactionId },
  });
}
