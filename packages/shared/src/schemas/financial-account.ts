import { z } from 'zod';
import { FinancialAccountType } from '../enums';

export const CreateFinancialAccountSchema = z
  .object({
    name: z.string().min(1, 'Name required').max(200),
    type: z.enum(Object.values(FinancialAccountType)),
    balance: z.coerce.number().default(0),
    color: z.string().min(1).max(20).optional(),
    creditLimit: z.coerce.number().positive().optional(),
    closingDay: z.coerce.number().int().min(1).max(31).optional(),
    dueDay: z.coerce.number().int().min(1).max(31).optional(),
  })
  .refine(
    data =>
      data.type !== 'CREDIT_CARD' ||
      (data.creditLimit != null && data.closingDay != null && data.dueDay != null),
    {
      message:
        'creditLimit, closingDay and dueDay are required for CREDIT_CARD accounts',
    }
  );

export const UpdateFinancialAccountSchema = z.object({
  name: z.string().min(1, 'Name required').max(200).optional(),
  type: z.enum(Object.values(FinancialAccountType)).optional(),
  balance: z.coerce.number().optional(),
  color: z.string().min(1).max(20).optional(),
  creditLimit: z.coerce.number().positive().optional(),
  closingDay: z.coerce.number().int().min(1).max(31).optional(),
  dueDay: z.coerce.number().int().min(1).max(31).optional(),
});

export type CreateFinancialAccountInput = z.infer<
  typeof CreateFinancialAccountSchema
>;
export type UpdateFinancialAccountInput = z.infer<
  typeof UpdateFinancialAccountSchema
>;
