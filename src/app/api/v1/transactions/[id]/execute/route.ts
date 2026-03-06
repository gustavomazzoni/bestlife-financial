import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import { executeTransaction } from '@/services/transactions';
import { apiResponse, apiError } from '@/lib/api/response';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const transaction = await executeTransaction(userId, id);
    return apiResponse(transaction, 200);
  } catch (error) {
    return apiError(error);
  }
}
