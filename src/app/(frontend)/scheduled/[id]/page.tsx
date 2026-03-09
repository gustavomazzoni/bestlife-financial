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
  ScheduledForm,
  ScheduledFormData,
  ScheduledWithCategory,
} from '@/components/features/scheduled';

function toDateInput(dateStr: string): string {
  return new Date(dateStr).toISOString().split('T')[0];
}

function toFormData(scheduled: ScheduledWithCategory): ScheduledFormData {
  return {
    description: scheduled.description,
    amount: parseFloat(String(scheduled.amount)),
    type: scheduled.type,
    categoryId: scheduled.categoryId,
    frequency: scheduled.frequency,
    startDate: toDateInput(scheduled.startDate),
    endDate: scheduled.endDate ? toDateInput(scheduled.endDate) : '',
    necessityLevel: scheduled.necessityLevel ?? undefined,
    valueAlignment: scheduled.valueAlignment ?? undefined,
    notificationDaysBefore: scheduled.notificationDaysBefore,
  };
}

export default function ScheduledEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [scheduled, setScheduled] =
    React.useState<ScheduledWithCategory | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/scheduled/${id}`);
        if (res.status === 404) {
          router.replace('/scheduled');
          return;
        }
        if (!res.ok) throw new Error('Erro ao carregar agendamento');
        const json = await res.json();
        setScheduled(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  const handleSubmit = async (data: ScheduledFormData) => {
    const { endDate, necessityLevel, valueAlignment, ...requiredData } = data;
    const body: Record<string, unknown> = { ...requiredData };
    if (endDate && data.frequency !== 'ONCE') body.endDate = endDate;
    if (necessityLevel) body.necessityLevel = necessityLevel;
    if (valueAlignment) body.valueAlignment = valueAlignment;

    const res = await fetch(`/api/v1/scheduled/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.error?.message ?? 'Erro ao salvar');
    }

    router.push('/scheduled');
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/v1/scheduled/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao remover agendamento');
      router.push('/scheduled');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Erro ao remover');
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

  if (!scheduled) {
    return null;
  }

  const isOnce = scheduled.frequency === 'ONCE';

  return (
    <div>
      <div className="container mx-auto max-w-2xl p-4 sm:p-8">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <ScheduledForm
          mode="edit"
          initialData={toFormData(scheduled)}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/scheduled')}
        />

        {/* Remove/Deactivate section */}
        <div className="mt-6 flex justify-start border-t border-gray-200 pt-6">
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-1.5 h-4 w-4" />
                {isOnce ? 'Excluir agendamento' : 'Desativar recorrência'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isOnce ? 'Excluir agendamento' : 'Desativar recorrência'}
                </DialogTitle>
                <DialogDescription>
                  {isOnce
                    ? `Deseja excluir "${scheduled.description}"? Esta ação não pode ser desfeita.`
                    : `Deseja desativar "${scheduled.description}"? A recorrência será removida da lista ativa.`}
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
                  {deleting
                    ? isOnce
                      ? 'Excluindo...'
                      : 'Desativando...'
                    : isOnce
                      ? 'Excluir'
                      : 'Desativar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
