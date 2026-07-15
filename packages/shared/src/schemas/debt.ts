import { z } from 'zod';

export const CreateDebtSchema = z.object({
  name: z.string().min(1, 'Name required').max(200),
  balance: z.coerce.number().min(0, 'Balance cannot be negative'),
  dueDate: z.coerce.date().optional(),
  installmentCurrent: z.coerce.number().int().min(0).optional(),
  installmentTotal: z.coerce.number().int().positive().optional(),
});

export const UpdateDebtSchema = CreateDebtSchema.partial();

export type CreateDebtInput = z.infer<typeof CreateDebtSchema>;
export type UpdateDebtInput = z.infer<typeof UpdateDebtSchema>;
