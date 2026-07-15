import { prisma } from '@/lib/db';
import { Investment } from '@/types';

export interface UpdateInvestmentInput {
  name?: string;
  category?: string;
  balance?: number;
}

export async function updateInvestment(
  userId: string,
  investmentId: string,
  data: UpdateInvestmentInput
): Promise<Investment> {
  const existing = await prisma.investment.findFirst({
    where: { id: investmentId, userId },
  });

  if (!existing) {
    throw new Error('Investment not found');
  }

  if (data.balance !== undefined && data.balance < 0) {
    throw new Error('Balance cannot be negative');
  }

  return prisma.investment.update({
    where: { id: investmentId },
    data,
  });
}
