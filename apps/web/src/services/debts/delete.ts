import { prisma } from '@/lib/db';

export async function deleteDebt(
  userId: string,
  debtId: string
): Promise<void> {
  const existing = await prisma.debt.findFirst({
    where: { id: debtId, userId },
  });

  if (!existing) {
    throw new Error('Debt not found');
  }

  await prisma.debt.delete({ where: { id: debtId } });
}
