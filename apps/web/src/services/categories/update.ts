import { prisma } from '@/lib/db';
import { Category } from '@/types/category';

export interface UpdateCategoryInput {
  name?: string;
  color?: string;
  icon?: string;
}

export async function updateCategory(
  categoryId: string,
  data: UpdateCategoryInput
): Promise<Category> {
  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!existing) {
    throw new Error('Category not found');
  }

  if (existing.isSystemDefault) {
    throw new Error('Forbidden: system default categories cannot be modified');
  }

  if (data.name && data.name !== existing.name) {
    const duplicate = await prisma.category.findFirst({
      where: { name: data.name, type: existing.type, NOT: { id: categoryId } },
    });

    if (duplicate) {
      throw new Error(
        'Conflict: a category with this name and type already exists'
      );
    }
  }

  return prisma.category.update({
    where: { id: categoryId },
    data,
  });
}
