import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import { apiResponse, apiError } from '@/lib/api/response';
import { UserProfileSchema } from '@/lib/validations/user';
import { getUserProfile, updateUserProfile } from '@/services/user';
import { unstable_update } from '@/lib/auth/config';

export async function GET() {
  try {
    const userId = await getUserId();
    const profile = await getUserProfile(userId);
    return apiResponse(profile);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const validated = UserProfileSchema.parse(body);
    const profile = await updateUserProfile(userId, validated);
    // Refresh the session JWT so the proxy sees onboardingCompleted=true on the
    // next request. Using the server-side update bypasses CSRF validation and
    // the client-side useSession() loading-state guard.
    await unstable_update({
      user: { onboardingCompleted: !!profile.dreamLifestyleCost },
    });
    return apiResponse(profile);
  } catch (error) {
    return apiError(error);
  }
}
