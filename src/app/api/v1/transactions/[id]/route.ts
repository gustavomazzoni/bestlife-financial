import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import {
  getTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/services/transactions';
import { apiResponse, apiError } from '@/lib/api/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId();
    const transaction = await getTransaction(userId, params.id);
    return apiResponse(transaction);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const transaction = await updateTransaction(userId, params.id, body);
    return apiResponse(transaction);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserId();
    await deleteTransaction(userId, params.id);
    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
