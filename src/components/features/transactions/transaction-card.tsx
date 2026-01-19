'use client';

import { Transaction } from '@/types/transaction';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { NecessityLevel, ValueAlignment } from '@/types';
import { cn } from '@/lib/utils';

interface TransactionCardProps {
  transaction: Transaction & {
    category?: { name: string; icon: string; color: string };
  };
}

export function TransactionCard({ transaction }: TransactionCardProps) {
  const amount = Number(transaction.amount);
  const isExpense = transaction.type === 'EXPENSE';
  const isNonAligned =
    transaction.necessityLevel === NecessityLevel.WANTS ||
    transaction.valueAlignment === ValueAlignment.FREEDOM_LIMITING ||
    !transaction.valueAlignment ||
    transaction.valueAlignment === ValueAlignment.DEFAULT;

  const getAlignmentColor = () => {
    if (transaction.valueAlignment === ValueAlignment.FREEDOM_ENABLING) {
      return 'border-green-500 bg-green-50';
    }
    if (transaction.valueAlignment === ValueAlignment.FREEDOM_LIMITING) {
      return 'border-red-500 bg-red-50';
    }
    if (transaction.necessityLevel === NecessityLevel.WANTS) {
      return 'border-amber-500 bg-amber-50';
    }
    return '';
  };

  return (
    <Card
      className={cn(
        'transition hover:shadow-md',
        isNonAligned && getAlignmentColor()
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {transaction.category?.icon && (
                <span className="text-xl">{transaction.category.icon}</span>
              )}
              <h3 className="font-semibold text-gray-900">
                {transaction.description}
              </h3>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <span>{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
              {transaction.category && (
                <>
                  <span>•</span>
                  <span>{transaction.category.name}</span>
                </>
              )}
              {transaction.necessityLevel && (
                <>
                  <span>•</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs',
                      transaction.necessityLevel === NecessityLevel.IMPORTANT &&
                        'bg-blue-100 text-blue-700',
                      transaction.necessityLevel === NecessityLevel.NEEDS &&
                        'bg-green-100 text-green-700',
                      transaction.necessityLevel === NecessityLevel.WANTS &&
                        'bg-orange-100 text-orange-700'
                    )}
                  >
                    {transaction.necessityLevel}
                  </span>
                </>
              )}
              {transaction.valueAlignment && (
                <>
                  <span>•</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs',
                      transaction.valueAlignment ===
                        ValueAlignment.FREEDOM_ENABLING &&
                        'bg-green-100 text-green-700',
                      transaction.valueAlignment ===
                        ValueAlignment.FREEDOM_LIMITING &&
                        'bg-red-100 text-red-700',
                      transaction.valueAlignment ===
                        ValueAlignment.EXPERIENCE &&
                        'bg-blue-100 text-blue-700',
                      transaction.valueAlignment === ValueAlignment.MATERIAL &&
                        'bg-purple-100 text-purple-700'
                    )}
                  >
                    {transaction.valueAlignment}
                  </span>
                </>
              )}
            </div>

            {isNonAligned && (
              <p className="mt-2 text-xs text-amber-700">
                ⚠️ Not aligned with your priorities
              </p>
            )}
          </div>

          <div className="text-right">
            <div
              className={cn(
                'text-lg font-bold',
                isExpense ? 'text-red-600' : 'text-green-600'
              )}
            >
              {isExpense ? '-' : '+'}R$ {amount.toFixed(2)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
