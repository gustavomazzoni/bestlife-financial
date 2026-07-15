import { z } from 'zod';
import { FinancialAccountType } from '../enums';

export const CreateFinancialAccountSchema = z.object({
  name: z.string().min(1, 'Name required').max(200),
  type: z.enum(Object.values(FinancialAccountType)),
  balance: z.coerce.number().default(0),
  color: z.string().min(1).max(20).optional(),
});

export const UpdateFinancialAccountSchema =
  CreateFinancialAccountSchema.partial();

export type CreateFinancialAccountInput = z.infer<
  typeof CreateFinancialAccountSchema
>;
export type UpdateFinancialAccountInput = z.infer<
  typeof UpdateFinancialAccountSchema
>;
