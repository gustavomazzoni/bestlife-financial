import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import {
  createFinancialAccount,
  listFinancialAccounts,
} from '@/services/accounts';
import { apiResponse, apiError } from '@/lib/api/response';
import { CreateFinancialAccountSchema } from '@/lib/validations/financial-account';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    const validated = CreateFinancialAccountSchema.parse(body);
    const account = await createFinancialAccount(userId, validated);
    return apiResponse(account, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function GET() {
  try {
    const userId = await getUserId();
    const accounts = await listFinancialAccounts(userId);
    return apiResponse(accounts);
  } catch (error) {
    return apiError(error);
  }
}
