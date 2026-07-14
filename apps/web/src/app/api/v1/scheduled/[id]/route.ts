import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import {
  getScheduledTransaction,
  updateScheduledTransaction,
  deleteScheduledTransaction,
} from '@/services/scheduled';
import { apiResponse, apiError } from '@/lib/api/response';
import { UpdateScheduledSchema } from '@/lib/validations/scheduled';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const scheduled = await getScheduledTransaction(userId, id);
    return apiResponse(scheduled);
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

    const validated = UpdateScheduledSchema.parse(body);
    const scheduled = await updateScheduledTransaction(userId, id, validated);
    return apiResponse(scheduled);
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
    await deleteScheduledTransaction(userId, id);
    return apiResponse(null, 204);
  } catch (error) {
    return apiError(error);
  }
}
