import { NextRequest } from 'next/server';
import { verifyMobileLoginCode } from '@/services/auth';
import { apiResponse, apiError } from '@/lib/api/response';
import { MobileLoginVerifySchema } from '@/lib/validations/mobile-login';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = MobileLoginVerifySchema.parse(body);

    const { token } = await verifyMobileLoginCode(email, code);
    return apiResponse({ token });
  } catch (error) {
    return apiError(error);
  }
}
