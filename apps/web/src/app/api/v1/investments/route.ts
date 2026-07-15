import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import { createInvestment, listInvestments } from '@/services/investments';
import { apiResponse, apiError } from '@/lib/api/response';
import { CreateInvestmentSchema } from '@/lib/validations/investment';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    const validated = CreateInvestmentSchema.parse(body);
    const investment = await createInvestment(userId, validated);
    return apiResponse(investment, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function GET() {
  try {
    const userId = await getUserId();
    const investments = await listInvestments(userId);
    return apiResponse(investments);
  } catch (error) {
    return apiError(error);
  }
}
