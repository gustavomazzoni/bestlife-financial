import { z } from 'zod';

export const CreateInvestmentSchema = z.object({
  name: z.string().min(1, 'Name required').max(200),
  category: z.string().min(1, 'Category required').max(100),
  balance: z.coerce.number().min(0, 'Balance cannot be negative'),
});

export const UpdateInvestmentSchema = CreateInvestmentSchema.partial();

export type CreateInvestmentInput = z.infer<typeof CreateInvestmentSchema>;
export type UpdateInvestmentInput = z.infer<typeof UpdateInvestmentSchema>;
