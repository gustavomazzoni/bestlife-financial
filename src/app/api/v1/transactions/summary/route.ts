import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getUserId } from '@/lib/auth/session';
import { getMonthlySummary } from '@/services/calculations/monthly-summary';
import { apiResponse, apiError } from '@/lib/api/response';

const SummaryQuerySchema = z.object({
  period: z.enum(['month']).default('month'),
  months: z.coerce.number().int().positive().max(12).default(3),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const query = SummaryQuerySchema.parse(params);
    const data = await getMonthlySummary(userId, query.months);
    return apiResponse(data, 200);
  } catch (error) {
    return apiError(error);
  }
}
