import { prisma } from '@/lib/db';
import { Investment } from '@/types';

export async function listInvestments(userId: string): Promise<Investment[]> {
  return prisma.investment.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
}
