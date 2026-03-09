import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import {
  createScheduledTransaction,
  listScheduledTransactions,
} from '@/services/scheduled';
import { apiResponse, apiError } from '@/lib/api/response';
import {
  CreateScheduledSchema,
  ListScheduledQuerySchema,
} from '@/lib/validations/scheduled';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    const validated = CreateScheduledSchema.parse(body);
    const scheduled = await createScheduledTransaction(userId, validated);
    return apiResponse(scheduled, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const searchParams = request.nextUrl.searchParams;

    const allPresentParams = Object.fromEntries(searchParams);
    const validatedQuery = ListScheduledQuerySchema.parse(allPresentParams);

    const result = await listScheduledTransactions(userId, validatedQuery);
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
