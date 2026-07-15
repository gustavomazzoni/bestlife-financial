import { prisma } from '@/lib/db';
import { FinancialAccount, FinancialAccountType } from '@/types';

export interface CreateFinancialAccountInput {
  name: string;
  type: FinancialAccountType;
  balance?: number;
  color?: string;
}

export async function createFinancialAccount(
  userId: string,
  data: CreateFinancialAccountInput
): Promise<FinancialAccount> {
  return prisma.financialAccount.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      balance: data.balance ?? 0,
      color: data.color,
    },
  });
}
