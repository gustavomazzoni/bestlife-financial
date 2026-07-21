import { prisma } from '@/lib/db';
import { CreditCard } from '@/types';

export async function listCreditCards(userId: string): Promise<CreditCard[]> {
  return prisma.creditCard.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
}
