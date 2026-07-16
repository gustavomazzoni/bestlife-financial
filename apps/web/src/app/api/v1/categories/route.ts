import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import { listCategories, createCategory } from '@/services/categories';
import { apiResponse, apiError } from '@/lib/api/response';
import { CreateCategorySchema } from '@/lib/validations/category';
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

export async function POST(request: NextRequest) {
  try {
    await getUserId();
    const body = await request.json();
    const validated = CreateCategorySchema.parse(body);
    const category = await createCategory(validated);
    return apiResponse(category, 201);
  } catch (error) {
    return apiError(error);
  }
}
