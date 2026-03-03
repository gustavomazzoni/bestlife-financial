'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  RecurringForm,
  RecurringFormData,
  RecurringWithCategory,
} from '@/components/features/recurring';

function toDateInput(dateStr: string): string {
  return new Date(dateStr).toISOString().split('T')[0];
}

function toFormData(recurring: RecurringWithCategory): RecurringFormData {
  return {
    description: recurring.description,
    amount: String(parseFloat(recurring.amount)),
    type: recurring.type,
    categoryId: recurring.categoryId,
    frequency: recurring.frequency,
    startDate: toDateInput(recurring.startDate),
    endDate: recurring.endDate ? toDateInput(recurring.endDate) : '',
    necessityLevel: recurring.necessityLevel ?? '',
    valueAlignment: recurring.valueAlignment ?? '',
    notificationDaysBefore: recurring.notificationDaysBefore,
  };
}

export default function RecurringEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [recurring, setRecurring] =
    React.useState<RecurringWithCategory | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/recurring/${id}`);
        if (res.status === 404) {
          router.replace('/recurring');
          return;
        }
        if (!res.ok) throw new Error('Erro ao carregar recorrência');
        const json = await res.json();
        setRecurring(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  const handleSubmit = async (data: RecurringFormData) => {
    const body: Record<string, unknown> = {
      amount: parseFloat(data.amount),
      description: data.description,
      type: data.type,
      categoryId: data.categoryId,
      frequency: data.frequency,
      startDate: data.startDate,
      notificationDaysBefore: data.notificationDaysBefore,
    };
    if (data.endDate) body.endDate = data.endDate;
    if (data.necessityLevel) body.necessityLevel = data.necessityLevel;
    if (data.valueAlignment) body.valueAlignment = data.valueAlignment;

    const res = await fetch(`/api/v1/recurring/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.error?.message ?? 'Erro ao salvar');
    }

    router.push('/recurring');
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/v1/recurring/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao desativar recorrência');
      router.push('/recurring');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao desativar');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        Carregando...
      </div>
    );
  }

  if (!recurring) {
    return null;
  }

  return (
    <div>
      <div className="container mx-auto max-w-2xl p-4 sm:p-8">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <RecurringForm
          mode="edit"
          initialData={toFormData(recurring)}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/recurring')}
        />

        {/* Deactivate section */}
        <div className="mt-6 flex justify-start border-t border-gray-200 pt-6">
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-1.5 h-4 w-4" />
                Desativar recorrência
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Desativar recorrência</DialogTitle>
                <DialogDescription>
                  Deseja desativar &ldquo;{recurring.description}&rdquo;? A
                  recorrência será removida da lista ativa.
                </DialogDescription>
              </DialogHeader>
              {deleteError && (
                <p className="text-sm text-red-600">{deleteError}</p>
              )}
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
                  {deleting ? 'Desativando...' : 'Desativar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
