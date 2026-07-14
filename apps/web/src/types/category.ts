import { Category } from '@/generated/prisma/client';

export type { Category };

export interface CategoryListResult {
  data: Category[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
