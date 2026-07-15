import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import {
  getInvestment,
  updateInvestment,
  deleteInvestment,
} from '@/services/investments';
import { apiResponse, apiError } from '@/lib/api/response';
import { UpdateInvestmentSchema } from '@/lib/validations/investment';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const investment = await getInvestment(userId, id);
    return apiResponse(investment);
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

    const validated = UpdateInvestmentSchema.parse(body);
    const investment = await updateInvestment(userId, id, validated);
    return apiResponse(investment);
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
    await deleteInvestment(userId, id);
    return apiResponse(null, 204);
  } catch (error) {
    return apiError(error);
  }
}
