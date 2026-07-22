import { z } from 'zod';
import { TransactionType, NecessityLevel, ValueAlignment } from '../enums';

const minimumDate = new Date('2023-01-01T00:00:00Z');
export const CreateTransactionSchema = z.object({
  amount: z.coerce.number().positive('O valor deve ser positivo'),
  description: z.string().min(3, 'Descrição muito curta').max(500),
  date: z.coerce
    .date()
    .min(minimumDate, { message: 'Date must be on or after January 1, 2023' }),
  type: z.enum(Object.values(TransactionType)),
  categoryId: z.string().min(1, 'Category required'),
  necessityLevel: z.enum(Object.values(NecessityLevel)).optional(),
  valueAlignment: z.enum(Object.values(ValueAlignment)).optional(),
  accountId: z.string().min(1, 'Conta é obrigatória'),
  toAccountId: z.string().min(1).optional(),
  notes: z.string().max(1000).optional(),
});

// .partial() makes accountId optional-to-omit on a PATCH while keeping it
// non-nullable when present — an existing transaction's account can be
// reassigned but never explicitly cleared to null. toAccountId keeps its
// own nullable override since only the account requirement changed.
export const UpdateTransactionSchema = CreateTransactionSchema.partial().extend(
  {
    toAccountId: z.string().min(1).nullable().optional(),
  }
);

export const ListTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: z.enum(Object.values(TransactionType)).optional(),
  categoryId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.enum(['date', 'amount', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof ListTransactionsQuerySchema>;
