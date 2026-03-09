import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import { executeRecurringTransaction } from '@/services/recurring';
import { apiResponse, apiError } from '@/lib/api/response';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const executionDate = body.date ? new Date(body.date) : undefined;
    const transaction = await executeRecurringTransaction(
      userId,
      id,
      executionDate
    );
    return apiResponse(transaction, 201);
  } catch (error) {
    return apiError(error);
  }
}
