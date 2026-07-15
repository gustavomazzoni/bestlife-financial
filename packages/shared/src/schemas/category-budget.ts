import { z } from 'zod';

export const UpsertCategoryBudgetSchema = z.object({
  monthlyAmount: z.coerce.number().positive('Monthly amount must be positive'),
});

export type UpsertCategoryBudgetInput = z.infer<
  typeof UpsertCategoryBudgetSchema
>;

export const ListCategoryBudgetsQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'month must be in YYYY-MM format')
    .optional(),
});

export type ListCategoryBudgetsQuery = z.infer<
  typeof ListCategoryBudgetsQuerySchema
>;
