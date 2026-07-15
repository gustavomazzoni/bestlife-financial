import { prisma } from '@/lib/db';
import { FinancialAccount } from '@/types';

export async function listFinancialAccounts(
  userId: string
): Promise<FinancialAccount[]> {
  return prisma.financialAccount.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
}
