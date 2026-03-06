import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getUserId } from '@/lib/auth/session';
import { getUpcomingItems } from '@/services/dashboard/upcoming';
import { apiResponse, apiError } from '@/lib/api/response';

const QuerySchema = z.object({
  days: z.coerce.number().int().positive().max(90).default(7),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const { days } = QuerySchema.parse(params);
    const items = await getUpcomingItems(userId, days);
    return apiResponse(items, 200);
  } catch (error) {
    return apiError(error);
  }
}
