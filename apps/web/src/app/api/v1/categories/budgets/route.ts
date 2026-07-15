import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import { getCategoryBudgets } from '@/services/categories';
import { apiResponse, apiError } from '@/lib/api/response';
import { ListCategoryBudgetsQuerySchema } from '@/lib/validations/category-budget';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { month } = ListCategoryBudgetsQuerySchema.parse(searchParams);

    const reference = month ? new Date(`${month}-01T00:00:00Z`) : new Date();
    const budgets = await getCategoryBudgets(userId, reference);
    return apiResponse(budgets);
  } catch (error) {
    return apiError(error);
  }
}
