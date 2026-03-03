'use client';

import * as React from 'react';
import Link from 'next/link';
import { format, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit2, Trash2, Play, Check, X } from 'lucide-react';
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
import { TransactionType, NecessityLevel, RecurringFrequency } from '@/types';

export interface RecurringWithCategory {
  id: string;
  amount: string;
  description: string;
  type: TransactionType;
  categoryId: string;
  category: { id: string; name: string; icon: string; color: string } | null;
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string | null;
  nextDueDate: string;
  lastCreatedDate: string | null;
  notificationDaysBefore: number;
  isActive: boolean;
  necessityLevel: NecessityLevel | null;
  valueAlignment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringCardProps {
  recurring: RecurringWithCategory;
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

const frequencyLabels: Record<RecurringFrequency, string> = {
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  YEARLY: 'Anual',
};

function formatCurrency(value: string): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(parseFloat(value));
}

function getDueBadge(nextDueDateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextDue = new Date(nextDueDateStr);
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

type ExecuteState = 'idle' | 'confirming' | 'loading';

export function RecurringCard({ recurring, onRefresh }: RecurringCardProps) {
  const [executeState, setExecuteState] = React.useState<ExecuteState>('idle');
  const [executeError, setExecuteError] = React.useState<string | null>(null);
  const [deactivateOpen, setDeactivateOpen] = React.useState(false);
  const [deactivating, setDeactivating] = React.useState(false);

  const typeInfo = typeConfig[recurring.type];
  const dueBadge = getDueBadge(recurring.nextDueDate);
  const expired = isExpired(recurring.endDate);

  const handleExecuteConfirm = async () => {
    setExecuteState('loading');
    setExecuteError(null);
    try {
      const res = await fetch(`/api/v1/recurring/${recurring.id}/execute`, {
        method: 'POST',
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? 'Erro ao executar');
      }
      setExecuteState('idle');
      onRefresh();
    } catch (err) {
      setExecuteError(err instanceof Error ? err.message : 'Erro ao executar');
      setExecuteState('idle');
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      const res = await fetch(`/api/v1/recurring/${recurring.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erro ao desativar');
      setDeactivateOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      setDeactivating(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300">
      <div className="flex items-start justify-between gap-4">
        {/* Main info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-gray-900">
              {recurring.description}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeInfo.color}`}
            >
              {typeInfo.label}
            </span>
            <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
              {frequencyLabels[recurring.frequency]}
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
              {recurring.category?.icon}{' '}
              {recurring.category?.name ?? 'Sem categoria'}
            </span>
            {recurring.endDate && (
              <>
                <span>·</span>
                <span>
                  Até{' '}
                  {format(new Date(recurring.endDate), "MMM 'de' yyyy", {
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
          {formatCurrency(recurring.amount)}
        </span>
      </div>

      {/* Execute error */}
      {executeError && (
        <div className="mt-2 rounded bg-red-50 px-3 py-2 text-xs text-red-700">
          {executeError}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
        {/* Execute — only shown when due or overdue */}
        <div className="flex items-center gap-2">
          {dueBadge.isDue && !expired && executeState === 'idle' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExecuteState('confirming')}
            >
              <Play className="mr-1 h-3 w-3" />
              Executar
            </Button>
          )}
          {executeState === 'confirming' && (
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">Confirmar?</span>
              <Button
                variant="default"
                size="icon-sm"
                onClick={handleExecuteConfirm}
                aria-label="Confirmar execução"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setExecuteState('idle')}
                aria-label="Cancelar execução"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          {executeState === 'loading' && (
            <span className="text-sm text-gray-500">Executando...</span>
          )}
        </div>

        {/* Edit + Deactivate */}
        <div className="flex items-center gap-1">
          <Link href={`/recurring/${recurring.id}`}>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Editar recorrência"
              className="text-gray-400 hover:text-gray-700"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </Link>

          <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-gray-400 hover:text-red-600"
                aria-label="Desativar recorrência"
              >
                <Trash2 className="h-4 w-4" />
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
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeactivateOpen(false)}
                  disabled={deactivating}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeactivate}
                  disabled={deactivating}
                >
                  {deactivating ? 'Desativando...' : 'Desativar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
