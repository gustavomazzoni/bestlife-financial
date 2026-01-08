import { prisma } from '@/lib/db';
import {
  ListTransactionsQuery,
  ListTransactionsQuerySchema,
} from '@/lib/validations/transaction';
import { TransactionListResult } from '@/types/transaction';

export async function listTransactions(
  userId: string,
  query: ListTransactionsQuery
): Promise<TransactionListResult> {
  const validated = ListTransactionsQuerySchema.parse(query);
  const { page, limit, type, category, startDate, endDate, sortBy, sortOrder } =
    validated;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { userId };

  if (type) where.type = type;
  if (category) where.category = category;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
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
