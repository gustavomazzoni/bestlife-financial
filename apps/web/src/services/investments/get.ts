import { prisma } from '@/lib/db';
import { Investment } from '@/types';

export async function getInvestment(
  userId: string,
  investmentId: string
): Promise<Investment> {
  const investment = await prisma.investment.findFirst({
    where: { id: investmentId, userId },
  });

  if (!investment) {
    throw new Error('Investment not found');
  }

  return investment;
}
