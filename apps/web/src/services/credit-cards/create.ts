import { prisma } from '@/lib/db';
import { CreditCard } from '@/types';

export interface CreateCreditCardInput {
  name: string;
  creditLimit: number;
  closingDay: number;
  dueDay: number;
  balance?: number;
  color?: string;
}

export async function createCreditCard(
  userId: string,
  data: CreateCreditCardInput
): Promise<CreditCard> {
  return prisma.creditCard.create({
    data: {
      userId,
      name: data.name,
      creditLimit: data.creditLimit,
      closingDay: data.closingDay,
      dueDay: data.dueDay,
      balance: data.balance ?? 0,
      color: data.color,
    },
  });
}
