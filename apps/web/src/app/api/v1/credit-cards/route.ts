import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import { createCreditCard, listCreditCards } from '@/services/credit-cards';
import { apiResponse, apiError } from '@/lib/api/response';
import { CreateCreditCardSchema } from '@/lib/validations/credit-card';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    const validated = CreateCreditCardSchema.parse(body);
    const creditCard = await createCreditCard(userId, validated);
    return apiResponse(creditCard, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function GET() {
  try {
    const userId = await getUserId();
    const creditCards = await listCreditCards(userId);
    return apiResponse(creditCards);
  } catch (error) {
    return apiError(error);
  }
}
