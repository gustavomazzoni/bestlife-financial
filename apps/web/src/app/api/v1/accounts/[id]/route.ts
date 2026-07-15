import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import {
  getFinancialAccount,
  updateFinancialAccount,
  deleteFinancialAccount,
} from '@/services/accounts';
import { apiResponse, apiError } from '@/lib/api/response';
import { UpdateFinancialAccountSchema } from '@/lib/validations/financial-account';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const account = await getFinancialAccount(userId, id);
    return apiResponse(account);
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

    const validated = UpdateFinancialAccountSchema.parse(body);
    const account = await updateFinancialAccount(userId, id, validated);
    return apiResponse(account);
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
    await deleteFinancialAccount(userId, id);
    return apiResponse(null, 204);
  } catch (error) {
    return apiError(error);
  }
}
