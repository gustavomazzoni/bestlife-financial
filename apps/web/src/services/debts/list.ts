import { prisma } from '@/lib/db';
import { Debt } from '@/types';

export async function listDebts(userId: string): Promise<Debt[]> {
  return prisma.debt.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
}
