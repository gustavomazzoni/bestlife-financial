import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import { apiResponse, apiError } from '@/lib/api/response';
import { UserProfileSchema } from '@/lib/validations/user';
import { getUserProfile, updateUserProfile } from '@/services/user';

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
    return apiResponse(profile);
  } catch (error) {
    return apiError(error);
  }
}
