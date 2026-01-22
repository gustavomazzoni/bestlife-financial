import { z } from 'zod';
import {
  TransactionType,
  NecessityLevel,
  ValueAlignment,
  RecurringFrequency,
} from '@/types';

export const CreateRecurringSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().min(3, 'Description too short').max(500),
  type: z.enum(
    Object.values(TransactionType) as [string, ...string[]]
  ) as z.ZodType<TransactionType>,
  categoryId: z.string().min(1, 'Category required'),
  frequency: z.enum(
    Object.values(RecurringFrequency) as [string, ...string[]]
  ) as z.ZodType<RecurringFrequency>,
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  necessityLevel: z
    .enum(Object.values(NecessityLevel) as [string, ...string[]])
    .optional() as z.ZodType<NecessityLevel | undefined>,
  valueAlignment: z
    .enum(Object.values(ValueAlignment) as [string, ...string[]])
    .optional() as z.ZodType<ValueAlignment | undefined>,
  notificationDaysBefore: z.coerce.number().int().min(0).max(30).optional(),
});

export const UpdateRecurringSchema = CreateRecurringSchema.partial();

export const ListRecurringQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  isActive: z
    .string()
    .optional()
    .default('true')
    .transform(val => val === 'true'),
  type: z
    .enum(Object.values(TransactionType) as [string, ...string[]])
    .optional() as z.ZodType<TransactionType | undefined>,
  frequency: z
    .enum(Object.values(RecurringFrequency) as [string, ...string[]])
    .optional() as z.ZodType<RecurringFrequency | undefined>,
});

export type CreateRecurringInput = z.infer<typeof CreateRecurringSchema>;
export type UpdateRecurringInput = z.infer<typeof UpdateRecurringSchema>;
export type ListRecurringQuery = z.infer<typeof ListRecurringQuerySchema>;
