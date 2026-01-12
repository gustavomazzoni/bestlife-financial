import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import { createTransaction, listTransactions } from '@/services/transactions';
import { apiResponse, apiError } from '@/lib/api/response';
import {
  CreateTransactionSchema,
  ListTransactionsQuerySchema,
} from '@/lib/validations/transaction';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    const validated = CreateTransactionSchema.parse(body);
    const transaction = await createTransaction(userId, validated);
    return apiResponse(transaction, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);

    const validatedQuery = ListTransactionsQuerySchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      type: searchParams.get('type'),
      categoryId: searchParams.get('categoryId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    const result = await listTransactions(userId, validatedQuery);
    return apiResponse(result.data, 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error) {
    return apiError(error);
  }
}
