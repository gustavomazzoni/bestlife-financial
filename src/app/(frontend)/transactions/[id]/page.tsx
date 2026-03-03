'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TransactionType, NecessityLevel, ValueAlignment } from '@/types';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

interface Transaction {
  id: string;
  amount: string;
  description: string;
  date: string;
  type: TransactionType;
  categoryId: string;
  necessityLevel: NecessityLevel | null;
  valueAlignment: ValueAlignment | null;
  notes: string | null;
}

const transactionEditSchema = z.object({
  amount: z.number().positive('O valor deve ser positivo'),
  description: z.string().min(3, 'Mínimo 3 caracteres').max(500),
  date: z.string().min(1, 'Informe a data'),
  type: z.enum(['INCOME', 'EXPENSE', 'SAVING', 'TRANSFER'] as const, {
    message: 'Selecione o tipo',
  }),
  categoryId: z.string().min(1, 'Selecione a categoria'),
  necessityLevel: z.string().optional(),
  valueAlignment: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof transactionEditSchema>;

const typeOptions: { value: TransactionType; label: string }[] = [
  { value: 'INCOME', label: 'Receita' },
  { value: 'EXPENSE', label: 'Despesa' },
  { value: 'SAVING', label: 'Poupança' },
  { value: 'TRANSFER', label: 'Transferência' },
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

function toDateInput(dateStr: string): string {
  return new Date(dateStr).toISOString().split('T')[0];
}

export default function TransactionEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(transactionEditSchema),
  });

  // Initial fetch
  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/transactions/${id}`);
        if (res.status === 404) {
          router.replace('/transactions');
          return;
        }
        if (!res.ok) throw new Error('Erro ao carregar transação');
        const json = await res.json();
        const txn: Transaction = json.data;
        reset({
          amount: parseFloat(txn.amount),
          description: txn.description,
          date: toDateInput(txn.date),
          type: txn.type,
          categoryId: txn.categoryId,
          necessityLevel: txn.necessityLevel ?? '',
          valueAlignment: txn.valueAlignment ?? '',
          notes: txn.notes ?? '',
        });
      } catch (err) {
        setError('root', {
          message:
            err instanceof Error ? err.message : 'Erro ao carregar transação',
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router, reset, setError]);

  // Fetch categories when type changes
  const currentType = watch('type');
  React.useEffect(() => {
    if (!currentType) return;
    async function loadCategories() {
      const res = await fetch(`/api/v1/categories?type=${currentType}`);
      if (!res.ok) return;
      const json = await res.json();
      setCategories(json.data ?? []);
    }
    loadCategories();
  }, [currentType]);

  const onSubmit = async (data: FormValues) => {
    try {
      const body: Record<string, unknown> = {
        amount: data.amount,
        description: data.description,
        date: data.date,
        type: data.type,
        categoryId: data.categoryId,
      };
      if (data.necessityLevel) body.necessityLevel = data.necessityLevel;
      if (data.valueAlignment) body.valueAlignment = data.valueAlignment;
      if (data.notes) body.notes = data.notes;

      const res = await fetch(`/api/v1/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError('root', {
          message: json?.error?.message || 'Erro ao salvar transação',
        });
        return;
      }
      router.push('/transactions');
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Erro ao salvar',
      });
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/transactions/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erro ao excluir transação');
      router.push('/transactions');
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Erro ao excluir',
      });
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        Carregando...
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-4 sm:p-8">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {errors.root && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {errors.root.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Amount */}
          <Field label="Valor (R$)" id="amount" error={errors.amount?.message}>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              {...register('amount', { valueAsNumber: true })}
              placeholder="0,00"
            />
          </Field>

          {/* Description */}
          <Field
            label="Descrição"
            id="description"
            error={errors.description?.message}
          >
            <Input
              id="description"
              {...register('description')}
              placeholder="Ex: Compras no mercado"
            />
          </Field>

          {/* Date */}
          <Field label="Data" id="date" error={errors.date?.message}>
            <Input id="date" type="date" {...register('date')} />
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

          {/* Category */}
          <Field label="Categoria" error={errors.categoryId?.message}>
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a categoria" />
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

          {/* Necessity Level */}
          <Field
            label="Nível de necessidade (opcional)"
            error={errors.necessityLevel?.message}
          >
            <Controller
              name="necessityLevel"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                >
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

          {/* Value Alignment */}
          <Field
            label="Alinhamento de valores (opcional)"
            error={errors.valueAlignment?.message}
          >
            <Controller
              name="valueAlignment"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                >
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

          {/* Notes */}
          <Field
            label="Notas (opcional)"
            id="notes"
            error={errors.notes?.message}
          >
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </Field>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" type="button">
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar exclusão</DialogTitle>
                  <DialogDescription>
                    Deseja excluir esta transação? Esta ação não pode ser
                    desfeita.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                    disabled={deleting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Excluindo...' : 'Excluir'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="flex gap-3">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push('/transactions')}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
