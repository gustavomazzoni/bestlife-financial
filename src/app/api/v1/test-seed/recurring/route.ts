/**
 * ⚠️  TEST/DEVELOPMENT ONLY — returns 404 in production.
 *
 * Creates a scheduled (recurring) transaction with a backdated nextOccurrence so it
 * appears as overdue in the UI, enabling E2E tests for the execute flow.
 */
import { NextRequest } from 'next/server';
import { getUserId } from '@/lib/auth/session';
import { prisma } from '@/lib/db';
import { apiResponse, apiError } from '@/lib/api/response';
import { subDays, subMonths } from 'date-fns';
import { TransactionType } from '@/types';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not Found', { status: 404 });
  }

  try {
    const userId = await getUserId();
    const body = await request.json();

    const type: TransactionType = body.type ?? 'EXPENSE';

    // Find first category matching the requested type (system defaults exist after migrations)
    const category = await prisma.category.findFirst({ where: { type } });
    if (!category) {
      throw new Error(`No category found for type ${type}`);
    }

    const today = new Date();
    const frequency = (body.frequency ?? 'MONTHLY') as
      | 'MONTHLY'
      | 'WEEKLY'
      | 'YEARLY';

    const scheduled = await prisma.scheduledTransaction.create({
      data: {
        userId,
        amount: body.amount ?? 100,
        description: body.description ?? 'Test overdue recurring',
        type,
        categoryId: category.id,
        frequency,
        startDate: subMonths(today, 2),
        nextOccurrence: subDays(today, 1), // yesterday → overdue
        notificationDaysBefore: 3,
      },
    });

    return apiResponse(scheduled, 201);
  } catch (error) {
    return apiError(error);
  }
}
