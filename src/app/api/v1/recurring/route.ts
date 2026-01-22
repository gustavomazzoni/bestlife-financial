import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import {
  createRecurringTransaction,
  listRecurringTransactions,
} from '@/services/recurring';
import { apiResponse, apiError } from '@/lib/api/response';
import {
  CreateRecurringSchema,
  ListRecurringQuerySchema,
} from '@/lib/validations/recurring';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    const validated = CreateRecurringSchema.parse(body);
    const recurring = await createRecurringTransaction(userId, validated);
    return apiResponse(recurring, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const searchParams = request.nextUrl.searchParams;

    const allPresentParams = Object.fromEntries(searchParams);
    const validatedQuery = ListRecurringQuerySchema.parse(allPresentParams);

    const result = await listRecurringTransactions(userId, validatedQuery);
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
