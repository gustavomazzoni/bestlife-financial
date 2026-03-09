import { prisma } from '@/lib/db';
import {
  ScheduledTransaction,
  TransactionType,
  ScheduleFrequency,
} from '@/types';

export interface ListScheduledQuery {
  page: number;
  limit: number;
  isActive?: boolean;
  type?: TransactionType;
  frequency?: ScheduleFrequency;
}

export interface ScheduledListResult {
  data: (ScheduledTransaction & {
    category: { id: string; name: string; icon: string; color: string } | null;
  })[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listScheduledTransactions(
  userId: string,
  query: ListScheduledQuery
): Promise<ScheduledListResult> {
  const { page, limit, isActive = true, type, frequency } = query;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { userId, isActive };

  if (type) {
    where.type = type;
  }

  if (frequency) {
    where.frequency = frequency;
  }

  const [data, total] = await Promise.all([
    prisma.scheduledTransaction.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { nextOccurrence: 'asc' },
      include: { category: true },
    }),
    prisma.scheduledTransaction.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
