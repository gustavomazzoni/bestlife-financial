import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import {
  getCreditCard,
  updateCreditCard,
  deleteCreditCard,
} from '@/services/credit-cards';
import { apiResponse, apiError } from '@/lib/api/response';
import { UpdateCreditCardSchema } from '@/lib/validations/credit-card';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const creditCard = await getCreditCard(userId, id);
    return apiResponse(creditCard);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const body = await request.json();

    const validated = UpdateCreditCardSchema.parse(body);
    const creditCard = await updateCreditCard(userId, id, validated);
    return apiResponse(creditCard);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    await deleteCreditCard(userId, id);
    return apiResponse(null, 204);
  } catch (error) {
    return apiError(error);
  }
}
