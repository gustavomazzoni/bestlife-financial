import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import { apiResponse, apiError } from '@/lib/api/response';
import { UserPreferencesSchema } from '@/lib/validations/user';
import { getUserPreferences, updateUserPreferences } from '@/services/user';

export async function GET() {
  try {
    const userId = await getUserId();
    const preferences = await getUserPreferences(userId);
    return apiResponse(preferences);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const validated = UserPreferencesSchema.parse(body);
    const preferences = await updateUserPreferences(userId, validated);
    return apiResponse(preferences);
  } catch (error) {
    return apiError(error);
  }
}
