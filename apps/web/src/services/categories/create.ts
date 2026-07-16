import { prisma } from '@/lib/db';
import { Category } from '@/types/category';
import { TransactionType } from '@/types/transaction';

export interface CreateCategoryInput {
  name: string;
  type: TransactionType;
  color?: string;
  icon?: string;
}

export async function createCategory(
  data: CreateCategoryInput
): Promise<Category> {
  const existing = await prisma.category.findFirst({
    where: { name: data.name, type: data.type },
  });

  if (existing) {
    throw new Error(
      'Conflict: a category with this name and type already exists'
    );
  }

  return prisma.category.create({
    data: {
      name: data.name,
      type: data.type,
      color: data.color,
      icon: data.icon,
      isSystemDefault: false,
    },
  });
}
