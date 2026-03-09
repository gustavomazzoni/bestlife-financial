'use client';

import * as React from 'react';
import Link from 'next/link';
import { format, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit2, Trash2, Play } from 'lucide-react';
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
import { ExecuteTransactionDialog } from '@/components/features/transactions/execute-transaction-dialog';
import { TransactionType, NecessityLevel, ScheduleFrequency } from '@/types';

export interface ScheduledWithCategory {
  id: string;
  amount: string;
  description: string;
  type: TransactionType;
  categoryId: string;
  category: { id: string; name: string; icon: string; color: string } | null;
  frequency: ScheduleFrequency;
  startDate: string;
  endDate: string | null;
  nextOccurrence: string;
  lastExecutedDate: string | null;
  notificationDaysBefore: number;
  isActive: boolean;
  necessityLevel: NecessityLevel | null;
  valueAlignment: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledCardProps {
  scheduled: ScheduledWithCategory;
  onRefresh: () => void;
}

const typeConfig: Record<
  TransactionType,
  { label: string; color: string; amountColor: string }
> = {
  INCOME: {
    label: 'Receita',
    color: 'bg-green-100 text-green-700',
    amountColor: 'text-green-600',
  },
  EXPENSE: {
    label: 'Despesa',
    color: 'bg-red-100 text-red-700',
    amountColor: 'text-red-600',
  },
  SAVING: {
    label: 'Poupança',
    color: 'bg-blue-100 text-blue-700',
    amountColor: 'text-blue-600',
  },
  TRANSFER: {
    label: 'Transferência',
    color: 'bg-gray-100 text-gray-700',
    amountColor: 'text-gray-700',
  },
};

const frequencyLabels: Record<ScheduleFrequency, string> = {
  ONCE: 'Uma vez',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  YEARLY: 'Anual',
};

const frequencyColors: Record<ScheduleFrequency, string> = {
  ONCE: 'bg-amber-100 text-amber-700',
  WEEKLY: 'bg-purple-100 text-purple-700',
  MONTHLY: 'bg-purple-100 text-purple-700',
  YEARLY: 'bg-purple-100 text-purple-700',
};

function formatCurrency(value: string): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(parseFloat(value));
}

function getDueBadge(nextOccurrenceStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextDue = new Date(nextOccurrenceStr);
  nextDue.setHours(0, 0, 0, 0);
  const days = differenceInCalendarDays(nextDue, today);

  if (days < 0)
    return {
      label: `${Math.abs(days)}d em atraso`,
      className: 'bg-red-100 text-red-700',
      isDue: true,
    };
  if (days === 0)
    return {
      label: 'Vence hoje',
      className: 'bg-orange-100 text-orange-700',
      isDue: true,
    };
  if (days <= 3)
    return {
      label: `Vence em ${days}d`,
      className: 'bg-yellow-100 text-yellow-700',
      isDue: false,
    };
  return {
    label: `Próximo: ${format(nextDue, 'dd/MM/yy', { locale: ptBR })}`,
    className: 'bg-gray-100 text-gray-600',
    isDue: false,
  };
}

function isExpired(endDateStr: string | null): boolean {
  if (!endDateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(endDateStr);
  endDate.setHours(0, 0, 0, 0);
  return endDate < today;
}

export function ScheduledCard({ scheduled, onRefresh }: ScheduledCardProps) {
  const [executeOpen, setExecuteOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const typeInfo = typeConfig[scheduled.type];
  const isOnce = scheduled.frequency === 'ONCE';
  const dueBadge = getDueBadge(scheduled.nextOccurrence);
  const expired = isExpired(scheduled.endDate);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/scheduled/${scheduled.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erro ao remover');
      setDeleteOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300">
      <div className="flex items-start justify-between gap-4">
        {/* Main info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-gray-900">
              {scheduled.description}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeInfo.color}`}
            >
              {typeInfo.label}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${frequencyColors[scheduled.frequency]}`}
            >
              {frequencyLabels[scheduled.frequency]}
            </span>
            {expired ? (
              <span className="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-500">
                Expirado
              </span>
            ) : (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${dueBadge.className}`}
              >
                {dueBadge.label}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            <span>
              {scheduled.category?.icon}{' '}
              {scheduled.category?.name ?? 'Sem categoria'}
            </span>
            {scheduled.endDate && !isOnce && (
              <>
                <span>·</span>
                <span>
                  Até{' '}
                  {format(new Date(scheduled.endDate), "MMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Amount */}
        <span
          className={`shrink-0 text-lg font-semibold ${typeInfo.amountColor}`}
        >
          {formatCurrency(scheduled.amount)}
        </span>
      </div>

      <ExecuteTransactionDialog
        open={executeOpen}
        onClose={() => setExecuteOpen(false)}
        scheduledId={scheduled.id}
        description={scheduled.description}
        onSuccess={() => {
          setExecuteOpen(false);
          onRefresh();
        }}
      />

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
        {/* Execute — shown when due/overdue */}
        <div className="flex items-center gap-2">
          {dueBadge.isDue && !expired && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExecuteOpen(true)}
            >
              <Play className="mr-1 h-3 w-3" />
              Executar
            </Button>
          )}
        </div>

        {/* Edit + Delete/Deactivate */}
        <div className="flex items-center gap-1">
          <Link href={`/scheduled/${scheduled.id}`}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Editar agendamento"
              className="text-gray-400 hover:text-gray-700"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </Link>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-gray-400 hover:text-red-600"
                aria-label={
                  isOnce ? 'Excluir agendamento' : 'Desativar recorrência'
                }
              >
                <Trash2 className="h-4 w-4" />
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
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteOpen(false)}
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
