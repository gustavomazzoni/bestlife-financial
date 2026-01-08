import { z } from 'zod';
import { TransactionType, NecessityLevel, ValueAlignment } from '@/types';

export const CreateTransactionSchema = z.object({
  amount: z.number().positive('O valor deve ser positivo'),
  description: z.string().min(3, 'Descrição muito curta').max(500),
  date: z.coerce
    .date()
    .max(new Date(), { message: 'Date cannot be in the future' }),
  type: z.enum(Object.values(TransactionType)),
  category: z.string().min(1, 'Categoria é obrigatória'),
  necessityLevel: z.enum(Object.values(NecessityLevel)).optional(),
  valueAlignment: z.enum(Object.values(ValueAlignment)).optional(),
  notes: z.string().max(1000).optional(),
});

export const UpdateTransactionSchema = CreateTransactionSchema.partial();

export const ListTransactionsQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  type: z.enum(Object.values(TransactionType)).optional(),
  category: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.enum(['date', 'amount', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof ListTransactionsQuerySchema>;
