import { prisma } from '@/lib/db';
import { CreditCard } from '@/types';

export async function getCreditCard(
  userId: string,
  creditCardId: string
): Promise<CreditCard> {
  const creditCard = await prisma.creditCard.findFirst({
    where: { id: creditCardId, userId },
  });

  if (!creditCard) {
    throw new Error('Credit card not found');
  }

  return creditCard;
}
