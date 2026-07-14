import { NextRequest } from 'next/server';
import { listCategories } from '@/services/categories';
import { apiResponse, apiError } from '@/lib/api/response';
import { TransactionType } from '@/types/transaction';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as TransactionType;

    const categories = await listCategories(type);
    return apiResponse(categories);
  } catch (error) {
    return apiError(error);
  }
}
