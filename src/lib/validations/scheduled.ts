import { z } from 'zod';
import {
  TransactionType,
  NecessityLevel,
  ValueAlignment,
  ScheduleFrequency,
} from '@/types';

const commonFields = {
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().min(3, 'Description too short').max(500),
  type: z.enum(
    Object.values(TransactionType) as [string, ...string[]]
  ) as z.ZodType<TransactionType>,
  categoryId: z.string().min(1, 'Category required'),
  necessityLevel: z
    .enum(Object.values(NecessityLevel) as [string, ...string[]])
    .optional() as z.ZodType<NecessityLevel | undefined>,
  valueAlignment: z
    .enum(Object.values(ValueAlignment) as [string, ...string[]])
    .optional() as z.ZodType<ValueAlignment | undefined>,
  notificationDaysBefore: z.coerce.number().int().min(0).max(30).optional(),
  notes: z.string().max(1000).optional(),
};

export const CreateScheduledSchema = z.discriminatedUnion('frequency', [
  // ONCE: one-time scheduled transaction
  z.object({
    ...commonFields,
    frequency: z.literal('ONCE'),
    startDate: z.coerce.date(),
  }),
  // RECURRING: repeating scheduled transaction
  z.object({
    ...commonFields,
    frequency: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY'] as const) as z.ZodType<
      'WEEKLY' | 'MONTHLY' | 'YEARLY'
    >,
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
  }),
]);

export const UpdateScheduledSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive').optional(),
  description: z.string().min(3, 'Description too short').max(500).optional(),
  type: (
    z.enum(
      Object.values(TransactionType) as [string, ...string[]]
    ) as z.ZodType<TransactionType>
  ).optional(),
  categoryId: z.string().min(1, 'Category required').optional(),
  frequency: (
    z.enum(
      Object.values(ScheduleFrequency) as [string, ...string[]]
    ) as z.ZodType<ScheduleFrequency>
  ).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional().nullable(),
  necessityLevel: (
    z
      .enum(Object.values(NecessityLevel) as [string, ...string[]])
      .optional() as z.ZodType<NecessityLevel | undefined>
  ).optional(),
  valueAlignment: (
    z
      .enum(Object.values(ValueAlignment) as [string, ...string[]])
      .optional() as z.ZodType<ValueAlignment | undefined>
  ).optional(),
  notificationDaysBefore: z.coerce.number().int().min(0).max(30).optional(),
  notes: z.string().max(1000).optional().nullable(),
});

export const ListScheduledQuerySchema = z.object({
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
    .enum(Object.values(ScheduleFrequency) as [string, ...string[]])
    .optional() as z.ZodType<ScheduleFrequency | undefined>,
});

export type CreateScheduledInput = z.infer<typeof CreateScheduledSchema>;
export type UpdateScheduledInput = z.infer<typeof UpdateScheduledSchema>;
export type ListScheduledQuery = z.infer<typeof ListScheduledQuerySchema>;
