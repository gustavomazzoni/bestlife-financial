import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import { upsertCategoryBudget } from '@/services/categories';
import { apiResponse, apiError } from '@/lib/api/response';
import { UpsertCategoryBudgetSchema } from '@/lib/validations/category-budget';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const body = await request.json();

    const { monthlyAmount } = UpsertCategoryBudgetSchema.parse(body);
    const budget = await upsertCategoryBudget(userId, id, monthlyAmount);
    return apiResponse(budget);
  } catch (error) {
    return apiError(error);
  }
}
