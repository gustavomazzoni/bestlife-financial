import { prisma } from '@/lib/db';
import { Debt } from '@/types';

export async function getDebt(userId: string, debtId: string): Promise<Debt> {
  const debt = await prisma.debt.findFirst({
    where: { id: debtId, userId },
  });

  if (!debt) {
    throw new Error('Debt not found');
  }

  return debt;
}
