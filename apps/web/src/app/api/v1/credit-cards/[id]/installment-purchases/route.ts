import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import { createInstallmentPurchase } from '@/services/credit-cards';
import { apiResponse, apiError } from '@/lib/api/response';
import { CreateInstallmentPurchaseSchema } from '@/lib/validations/credit-card';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const body = await request.json();

    const validated = CreateInstallmentPurchaseSchema.parse(body);
    const transactions = await createInstallmentPurchase(userId, id, validated);
    return apiResponse(transactions, 201);
  } catch (error) {
    return apiError(error);
  }
}
