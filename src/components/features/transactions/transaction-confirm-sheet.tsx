'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateTransactionSchema,
  CreateTransactionInput,
} from '@/lib/validations/transaction';
import { TransactionType, NecessityLevel, ValueAlignment } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCreateTransaction } from '@/hooks/use-transactions';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Loader2, X } from 'lucide-react';
import { InferenceResult } from '@/services/transactions/infer';
import { Category } from '@/types/category';

interface TransactionConfirmSheetProps {
  inferenceResult: InferenceResult;
  onClose: () => void;
  onSuccess?: () => void;
}

const alignmentMessages: Record<
  ValueAlignment,
  { message: string; color: string }
> = {
  [ValueAlignment.FREEDOM_ENABLING]: {
    message: 'Supports your value: Energy & Vitality',
    color: 'text-green-600',
  },
  [ValueAlignment.ALIGNED]: {
    message: 'This aligns with your core values',
    color: 'text-green-600',
  },
  [ValueAlignment.DEFAULT]: {
    message: 'This looks like a default, everyday expense',
    color: 'text-gray-600',
  },
  [ValueAlignment.EXPERIENCE]: {
    message: 'This is an experience-based purchase',
    color: 'text-blue-600',
  },
  [ValueAlignment.MATERIAL]: {
    message: 'This is a material purchase',
    color: 'text-orange-600',
  },
  [ValueAlignment.FREEDOM_LIMITING]: {
    message: "This doesn't clearly support your core values",
    color: 'text-red-600',
  },
};

export function TransactionConfirmSheet({
  inferenceResult,
  onClose,
  onSuccess,
}: TransactionConfirmSheetProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const createMutation = useCreateTransaction();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateTransactionInput>({
    resolver: zodResolver(CreateTransactionSchema),
    defaultValues: {
      ...inferenceResult.inferred,
      date: inferenceResult.inferred.date || new Date(),
    },
  });

  const transactionType = watch('type');
  const valueAlignment = watch('valueAlignment');

  // Fetch categories when type changes
  useEffect(() => {
    if (transactionType) {
      fetch(`/api/v1/categories?type=${transactionType}`)
        .then(res => res.json())
        .then(data => setCategories(data.data || []))
        .catch(() => setCategories([]));
    }
  }, [transactionType]);

  const onSubmit = async (data: CreateTransactionInput) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success('Transaction saved successfully!');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save transaction'
      );
    }
  };

  const alignmentInfo = valueAlignment
    ? alignmentMessages[valueAlignment]
    : null;

  return (
    <Card className="mt-4 border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Confirm Transaction</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {inferenceResult.confidence < 0.7 && (
          <p className="text-sm text-amber-600">
            We need a bit more info to save this transaction
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Summary Row */}
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              {watch('amount') && (
                <span className="font-semibold">
                  R$ {Number(watch('amount')).toFixed(2)}
                </span>
              )}
              {watch('type') && (
                <span className="text-muted-foreground">• {watch('type')}</span>
              )}
              {watch('date') && (
                <span className="text-muted-foreground">
                  • {format(new Date(watch('date')!), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount">Amount (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              className={errors.amount ? 'border-red-500' : ''}
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-500">
                {errors.amount.message}
              </p>
            )}
          </div>

          {/* Type */}
          <div>
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              {...register('type')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {Object.values(TransactionType).map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          {/* Category */}
          {transactionType && (
            <div>
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                {...register('categoryId')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.categoryId.message}
                </p>
              )}
            </div>
          )}

          {/* Date */}
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              {...register('date', {
                valueAsDate: false,
                setValueAs: value => {
                  if (!value) return new Date();
                  return new Date(value);
                },
              })}
              defaultValue={format(
                inferenceResult.inferred.date || new Date(),
                'yyyy-MM-dd'
              )}
              max={format(new Date(), 'yyyy-MM-dd')}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-500">{errors.date.message}</p>
            )}
          </div>

          {/* Necessity Level */}
          <div>
            <Label htmlFor="necessityLevel">Necessity Level</Label>
            <select
              id="necessityLevel"
              {...register('necessityLevel')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select (optional)</option>
              {Object.values(NecessityLevel).map(level => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Value Alignment */}
          <div>
            <Label htmlFor="valueAlignment">Value Alignment</Label>
            <select
              id="valueAlignment"
              {...register('valueAlignment')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select (optional)</option>
              {Object.values(ValueAlignment).map(alignment => (
                <option key={alignment} value={alignment}>
                  {alignment}
                </option>
              ))}
            </select>
            {alignmentInfo && (
              <p className={`mt-1 text-sm ${alignmentInfo.color}`}>
                {alignmentInfo.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              rows={2}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" {...register('notes')} rows={2} />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Transaction'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
