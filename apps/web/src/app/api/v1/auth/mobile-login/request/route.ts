import { NextRequest } from 'next/server';
import { requestMobileLoginCode } from '@/services/auth';
import { apiResponse, apiError } from '@/lib/api/response';
import { MobileLoginRequestSchema } from '@/lib/validations/mobile-login';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = MobileLoginRequestSchema.parse(body);

    await requestMobileLoginCode(email);
    return apiResponse({ sent: true });
  } catch (error) {
    return apiError(error);
  }
}
