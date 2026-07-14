import { prisma } from '@/lib/db';
import { ScheduledTransaction } from '@/types';

export async function getScheduledTransaction(
  userId: string,
  scheduledId: string
): Promise<
  ScheduledTransaction & {
    category: { id: string; name: string; icon: string; color: string } | null;
  }
> {
  const scheduled = await prisma.scheduledTransaction.findFirst({
    where: { id: scheduledId, userId },
    include: { category: true },
  });

  if (!scheduled) {
    throw new Error('Scheduled transaction not found');
  }

  return scheduled;
}
