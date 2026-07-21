import { prisma } from '@/lib/db';
import { CreditCard } from '@/types';

export interface UpdateCreditCardInput {
  name?: string;
  creditLimit?: number;
  closingDay?: number;
  dueDay?: number;
  balance?: number;
  color?: string;
}

export async function updateCreditCard(
  userId: string,
  creditCardId: string,
  data: UpdateCreditCardInput
): Promise<CreditCard> {
  const existing = await prisma.creditCard.findFirst({
    where: { id: creditCardId, userId },
  });

  if (!existing) {
    throw new Error('Credit card not found');
  }

  return prisma.creditCard.update({
    where: { id: creditCardId },
    data,
  });
}
