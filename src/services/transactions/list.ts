import { prisma } from '@/lib/db';
import { ListTransactionsQuery } from '@/lib/validations/transaction';
import { TransactionListResult } from '@/types/transaction';

export async function listTransactions(
  userId: string,
  query: ListTransactionsQuery
): Promise<TransactionListResult> {
  const {
    page,
    limit,
    type,
    status,
    categoryId,
    startDate,
    endDate,
    sortBy,
    sortOrder,
  } = query;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { userId, type, status, categoryId };
  if (startDate || endDate) {
    where.date = { gte: startDate, lte: endDate };
  }

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: { category: true },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
