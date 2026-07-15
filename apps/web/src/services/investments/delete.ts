import { prisma } from '@/lib/db';

export async function deleteInvestment(
  userId: string,
  investmentId: string
): Promise<void> {
  const existing = await prisma.investment.findFirst({
    where: { id: investmentId, userId },
  });

  if (!existing) {
    throw new Error('Investment not found');
  }

  await prisma.investment.delete({ where: { id: investmentId } });
}
