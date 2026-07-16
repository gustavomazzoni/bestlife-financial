import { z } from 'zod';
import { TransactionType } from '../enums';

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Name required').max(100),
  type: z.enum(Object.values(TransactionType)),
  color: z.string().min(1).max(20).optional(),
  icon: z.string().min(1).max(10).optional(),
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(1, 'Name required').max(100).optional(),
  color: z.string().min(1).max(20).optional(),
  icon: z.string().min(1).max(10).optional(),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
