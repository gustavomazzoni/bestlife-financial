import { prisma } from '@/lib/db';
import { Category } from '@/types/category';
import { TransactionType } from '@/types/transaction';

export async function listCategories(
  type?: TransactionType
): Promise<Category[]> {
  return await prisma.category.findMany({
    where: type ? { type } : undefined,
    orderBy: { name: 'asc' },
  });
}
