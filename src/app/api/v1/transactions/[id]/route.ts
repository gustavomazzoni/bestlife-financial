import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import {
  getTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/services/transactions';
import { apiResponse, apiError } from '@/lib/api/response';
import { UpdateTransactionSchema } from '@/lib/validations/transaction';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserId();
    const transaction = await getTransaction(userId, id);
    return apiResponse(transaction);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserId();
    const body = await request.json();

    const validated = UpdateTransactionSchema.parse(body);
    const transaction = await updateTransaction(userId, id, validated);
    return apiResponse(transaction);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserId();
    await deleteTransaction(userId, id);
    return apiResponse(null, 204);
  } catch (error) {
    return apiError(error);
  }
}
