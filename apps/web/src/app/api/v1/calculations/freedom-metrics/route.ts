import { getUserId } from '@/lib/auth/session';
import { apiResponse, apiError } from '@/lib/api/response';
import { calculateFreedomMetrics } from '@/services/calculations/freedom-metrics';

export async function GET() {
  try {
    const userId = await getUserId();
    const metrics = await calculateFreedomMetrics(userId);
    return apiResponse(metrics);
  } catch (error) {
    return apiError(error);
  }
}
