import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import { apiResponse, apiError } from '@/lib/api/response';
import { inferTransaction } from '@/services/transactions/infer';
import { z } from 'zod';

const InferTransactionSchema = z.object({
  text: z.string().min(1, 'Text is required').max(1000),
});

export async function POST(request: NextRequest) {
  try {
    await getUserId();
    const body = await request.json();

    const { text } = InferTransactionSchema.parse(body);
    const result = await inferTransaction(text);

    return apiResponse(result, 200);
  } catch (error) {
    return apiError(error);
  }
}
