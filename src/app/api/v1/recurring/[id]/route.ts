import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import {
  getRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from '@/services/recurring';
import { apiResponse, apiError } from '@/lib/api/response';
import { UpdateRecurringSchema } from '@/lib/validations/recurring';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const recurring = await getRecurringTransaction(userId, id);
    return apiResponse(recurring);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const body = await request.json();

    const validated = UpdateRecurringSchema.parse(body);
    const recurring = await updateRecurringTransaction(userId, id, validated);
    return apiResponse(recurring);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    await deleteRecurringTransaction(userId, id);
    return apiResponse(null, 204);
  } catch (error) {
    return apiError(error);
  }
}
