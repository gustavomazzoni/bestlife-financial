import { prisma } from '@/lib/db';
import { Investment } from '@/types';

export interface CreateInvestmentInput {
  name: string;
  category: string;
  balance: number;
}

export async function createInvestment(
  userId: string,
  data: CreateInvestmentInput
): Promise<Investment> {
  if (data.balance < 0) {
    throw new Error('Balance cannot be negative');
  }

  return prisma.investment.create({
    data: {
      userId,
      name: data.name,
      category: data.category,
      balance: data.balance,
    },
  });
}
