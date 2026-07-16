import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import { updateCategory, deleteCategory } from '@/services/categories';
import { apiResponse, apiError } from '@/lib/api/response';
import { UpdateCategorySchema } from '@/lib/validations/category';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getUserId();
    const { id } = await params;
    const body = await request.json();
    const validated = UpdateCategorySchema.parse(body);
    const category = await updateCategory(id, validated);
    return apiResponse(category);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getUserId();
    const { id } = await params;
    await deleteCategory(id);
    return apiResponse(null, 204);
  } catch (error) {
    return apiError(error);
  }
}
