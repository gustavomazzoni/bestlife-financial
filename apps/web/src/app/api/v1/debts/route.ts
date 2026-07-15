import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import { createDebt, listDebts } from '@/services/debts';
import { apiResponse, apiError } from '@/lib/api/response';
import { CreateDebtSchema } from '@/lib/validations/debt';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    const validated = CreateDebtSchema.parse(body);
    const debt = await createDebt(userId, validated);
    return apiResponse(debt, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function GET() {
  try {
    const userId = await getUserId();
    const debts = await listDebts(userId);
    return apiResponse(debts);
  } catch (error) {
    return apiError(error);
  }
}
