import { prisma } from '@/lib/db';

export async function deleteCreditCard(
  userId: string,
  creditCardId: string
): Promise<void> {
  const existing = await prisma.creditCard.findFirst({
    where: { id: creditCardId, userId },
  });

  if (!existing) {
    throw new Error('Credit card not found');
  }

  await prisma.creditCard.delete({ where: { id: creditCardId } });
}
