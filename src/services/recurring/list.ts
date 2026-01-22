import { prisma } from '@/lib/db';
import {
  RecurringTransaction,
  TransactionType,
  RecurringFrequency,
} from '@/types';

export interface ListRecurringQuery {
  page: number;
  limit: number;
  isActive?: boolean;
  type?: TransactionType;
  frequency?: RecurringFrequency;
}

export interface RecurringListResult {
  data: RecurringTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listRecurringTransactions(
  userId: string,
  query: ListRecurringQuery
): Promise<RecurringListResult> {
  const { page, limit, isActive = true, type, frequency } = query;

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { userId, isActive };

  if (type) {
    where.type = type;
  }

  if (frequency) {
    where.frequency = frequency;
  }

  const [data, total] = await Promise.all([
    prisma.recurringTransaction.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { nextDueDate: 'asc' },
      include: { category: true },
    }),
    prisma.recurringTransaction.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
