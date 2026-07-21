import { z } from 'zod';
import { NecessityLevel, ValueAlignment } from '../enums';

export const CreateCreditCardSchema = z.object({
  name: z.string().min(1, 'Name required').max(200),
  creditLimit: z.coerce.number().positive('O limite deve ser positivo'),
  closingDay: z.coerce.number().int().min(1).max(31),
  dueDay: z.coerce.number().int().min(1).max(31),
  balance: z.coerce.number().default(0),
  color: z.string().min(1).max(20).optional(),
});

export const UpdateCreditCardSchema = CreateCreditCardSchema.partial();

export const CreateInstallmentPurchaseSchema = z.object({
  amount: z.coerce.number().positive('O valor deve ser positivo'),
  description: z.string().min(3, 'Descrição muito curta').max(500),
  date: z.coerce.date(),
  categoryId: z.string().min(1, 'Category required'),
  necessityLevel: z.enum(Object.values(NecessityLevel)).optional(),
  valueAlignment: z.enum(Object.values(ValueAlignment)).optional(),
  notes: z.string().max(1000).optional(),
  installments: z.coerce.number().int().min(1).max(24).default(1),
});

export type CreateCreditCardInput = z.infer<typeof CreateCreditCardSchema>;
export type UpdateCreditCardInput = z.infer<typeof UpdateCreditCardSchema>;
export type CreateInstallmentPurchaseInput = z.infer<
  typeof CreateInstallmentPurchaseSchema
>;
