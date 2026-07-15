import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getUserId } from '@/lib/auth/session';
import { apiResponse, apiError } from '@/lib/api/response';
import { getSpendingBreakdown } from '@/services/calculations/spending-analysis';

const QuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'month must be in YYYY-MM format')
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const { month } = QuerySchema.parse(params);

    const reference = month ? new Date(`${month}-01T00:00:00Z`) : new Date();
    const breakdown = await getSpendingBreakdown(userId, 'month', reference);
    return apiResponse(breakdown);
  } catch (error) {
    return apiError(error);
  }
}
