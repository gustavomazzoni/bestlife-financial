import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import { getDebt, updateDebt, deleteDebt } from '@/services/debts';
import { apiResponse, apiError } from '@/lib/api/response';
import { UpdateDebtSchema } from '@/lib/validations/debt';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const debt = await getDebt(userId, id);
    return apiResponse(debt);
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

    const validated = UpdateDebtSchema.parse(body);
    const debt = await updateDebt(userId, id, validated);
    return apiResponse(debt);
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
    await deleteDebt(userId, id);
    return apiResponse(null, 204);
  } catch (error) {
    return apiError(error);
  }
}
