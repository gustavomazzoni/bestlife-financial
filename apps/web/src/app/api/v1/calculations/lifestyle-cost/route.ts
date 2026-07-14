import { getUserId } from '@/lib/auth/session';
import { apiResponse, apiError } from '@/lib/api/response';
import { getUserProfile } from '@/services/user';

export async function GET() {
  try {
    const userId = await getUserId();
    const profile = await getUserProfile(userId);
    return apiResponse({ dreamLifestyleCost: profile.dreamLifestyleCost });
  } catch (error) {
    return apiError(error);
  }
}
