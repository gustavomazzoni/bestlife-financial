import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import { executeScheduledTransaction } from '@/services/scheduled';
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
    const transaction = await executeScheduledTransaction(
      userId,
      id,
      executionDate
    );
    return apiResponse(transaction, 201);
  } catch (error) {
    return apiError(error);
  }
}
