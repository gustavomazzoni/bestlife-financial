'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  TransactionType,
  NecessityLevel,
  ValueAlignment,
  RecurringFrequency,
} from '@/types';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

const recurringFormSchema = z
  .object({
    description: z
      .string()
      .min(3, 'Descrição deve ter pelo menos 3 caracteres')
      .max(500),
    amount: z.number().positive('Valor deve ser positivo'),
    type: z.enum(['INCOME', 'EXPENSE', 'SAVING', 'TRANSFER'] as const, {
      message: 'Selecione o tipo',
    }),
    categoryId: z.string().min(1, 'Selecione a categoria'),
    frequency: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY'] as const, {
      message: 'Selecione a frequência',
    }),
    startDate: z.string().min(1, 'Informe a data de início'),
    endDate: z.string().optional(),
    necessityLevel: z.string().optional(),
    valueAlignment: z.string().optional(),
    notificationDaysBefore: z.number().int().min(0).max(30),
  })
  .refine(
    data => !(data.endDate && data.startDate && data.endDate <= data.startDate),
    {
      message: 'Data de término deve ser após a data de início',
      path: ['endDate'],
    }
  );

export type RecurringFormData = z.infer<typeof recurringFormSchema>;

interface RecurringFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<RecurringFormData>;
  onSubmit: (data: RecurringFormData) => Promise<void>;
  onCancel: () => void;
}

const typeOptions: { value: TransactionType; label: string }[] = [
  { value: 'INCOME', label: 'Receita' },
  { value: 'EXPENSE', label: 'Despesa' },
  { value: 'SAVING', label: 'Poupança' },
  { value: 'TRANSFER', label: 'Transferência' },
];

const frequencyOptions: { value: RecurringFrequency; label: string }[] = [
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'YEARLY', label: 'Anual' },
];

const necessityOptions: { value: NecessityLevel; label: string }[] = [
  { value: 'NEEDS', label: 'Necessidade' },
  { value: 'IMPORTANT', label: 'Importante' },
  { value: 'WANTS', label: 'Desejo' },
];

const alignmentOptions: { value: ValueAlignment; label: string }[] = [
  { value: 'ALIGNED', label: 'Alinhado' },
  { value: 'DEFAULT', label: 'Padrão' },
  { value: 'EXPERIENCE', label: 'Experiência' },
  { value: 'MATERIAL', label: 'Material' },
  { value: 'FREEDOM_ENABLING', label: 'Liberdade' },
  { value: 'FREEDOM_LIMITING', label: 'Limitante' },
];

export function RecurringForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
}: RecurringFormProps) {
  const [categories, setCategories] = React.useState<Category[]>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RecurringFormData>({
    resolver: zodResolver(recurringFormSchema),
    defaultValues: {
      description: '',
      type: undefined,
      categoryId: '',
      frequency: undefined,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      necessityLevel: undefined,
      valueAlignment: undefined,
      notificationDaysBefore: 3,
      ...initialData,
    },
  });

  const currentType = watch('type');

  React.useEffect(() => {
    if (!currentType) {
      setCategories([]);
      return;
    }
    async function loadCategories() {
      const res = await fetch(`/api/v1/categories?type=${currentType}`);
      if (!res.ok) return;
      const json = await res.json();
      setCategories(json.data ?? []);
    }
    loadCategories();
  }, [currentType]);

  const onFormSubmit = async (data: RecurringFormData) => {
    try {
      await onSubmit(data);
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Erro ao salvar',
      });
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {errors.root && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {errors.root.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
        {/* Description */}
        <Field
          label="Descrição"
          id="description"
          error={errors.description?.message}
        >
          <Input
            id="description"
            {...register('description')}
            placeholder="Ex: Aluguel, Salário, Plano de saúde"
          />
        </Field>

        {/* Amount */}
        <Field label="Valor (R$)" id="amount" error={errors.amount?.message}>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            {...register('amount', { valueAsNumber: true })}
            placeholder="0,00"
          />
        </Field>

        {/* Type */}
        <Field label="Tipo" error={errors.type?.message}>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? ''}
                onValueChange={val => {
                  field.onChange(val);
                  setValue('categoryId', '');
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        {/* Category — filtered by type */}
        <Field label="Categoria" error={errors.categoryId?.message}>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? ''}
                onValueChange={field.onChange}
                disabled={!currentType}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !currentType
                        ? 'Selecione o tipo primeiro'
                        : 'Selecione a categoria'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        {/* Frequency */}
        <Field label="Frequência" error={errors.frequency?.message}>
          <Controller
            name="frequency"
            control={control}
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a frequência" />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        {/* Start Date */}
        <Field
          label="Data de início"
          id="startDate"
          error={errors.startDate?.message}
        >
          <Input id="startDate" type="date" {...register('startDate')} />
        </Field>

        {/* End Date (optional) */}
        <Field
          label="Data de término (opcional)"
          id="endDate"
          error={errors.endDate?.message}
        >
          <Input id="endDate" type="date" {...register('endDate')} />
        </Field>

        {/* Necessity Level (optional) */}
        <Field
          label="Nível de necessidade (opcional)"
          error={errors.necessityLevel?.message}
        >
          <Controller
            name="necessityLevel"
            control={control}
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {necessityOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        {/* Value Alignment (optional) */}
        <Field
          label="Alinhamento de valores (opcional)"
          error={errors.valueAlignment?.message}
        >
          <Controller
            name="valueAlignment"
            control={control}
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {alignmentOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        {/* Notification Days Before */}
        <Field
          label="Notificar com antecedência (dias)"
          id="notificationDaysBefore"
          error={errors.notificationDaysBefore?.message}
        >
          <Input
            id="notificationDaysBefore"
            type="number"
            min="0"
            max="30"
            {...register('notificationDaysBefore', { valueAsNumber: true })}
          />
        </Field>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Salvando...'
              : mode === 'create'
                ? 'Criar recorrência'
                : 'Salvar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
