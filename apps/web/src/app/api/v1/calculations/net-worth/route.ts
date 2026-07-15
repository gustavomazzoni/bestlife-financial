import { getUserId } from '@/lib/auth/session';
import { apiResponse, apiError } from '@/lib/api/response';
import { calculateNetWorth } from '@/services/calculations/net-worth';

export async function GET() {
  try {
    const userId = await getUserId();
    const netWorth = await calculateNetWorth(userId);
    return apiResponse(netWorth);
  } catch (error) {
    return apiError(error);
  }
}
