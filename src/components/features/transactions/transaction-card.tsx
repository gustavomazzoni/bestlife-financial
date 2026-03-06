'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { Trash2, RefreshCw, CheckCircle } from 'lucide-react';
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
import { TransactionType, TransactionStatus, NecessityLevel } from '@/types';

export interface TransactionWithCategory {
  id: string;
  amount: string;
  description: string;
  date: string;
  type: TransactionType;
  status: TransactionStatus;
  categoryId: string;
  category: { id: string; name: string; color: string; icon: string } | null;
  necessityLevel: NecessityLevel | null;
  valueAlignment: string | null;
  isRecurring: boolean;
  recurringId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface TransactionCardProps {
  transaction: TransactionWithCategory;
  onDelete: (id: string) => void;
  onExecute?: (id: string) => void;
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

const necessityLabels: Record<NecessityLevel, string> = {
  IMPORTANT: 'Importante',
  NEEDS: 'Necessidade',
  WANTS: 'Desejo',
};

function formatCurrency(value: string): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(parseFloat(value));
}

export function TransactionCard({
  transaction,
  onDelete,
  onExecute,
}: TransactionCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const isPending = transaction.status === 'PENDING';

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      const response = await fetch(
        `/api/v1/transactions/${transaction.id}/execute`,
        { method: 'POST' }
      );
      if (!response.ok) throw new Error('Erro ao executar transação');
      onExecute?.(transaction.id);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsExecuting(false);
    }
  };

  const typeInfo = typeConfig[transaction.type];

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/v1/transactions/${transaction.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao excluir transação');
      setDialogOpen(false);
      onDelete(transaction.id);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300">
      <button
        className="flex flex-1 items-center gap-4 text-left"
        aria-label={`Editar ${transaction.description}`}
        onClick={() => router.push(`/transactions/${transaction.id}`)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-gray-900">
              {transaction.description}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeInfo.color}`}
            >
              {typeInfo.label}
            </span>
            {isPending && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                PENDENTE
              </span>
            )}
            {transaction.necessityLevel && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {necessityLabels[transaction.necessityLevel]}
              </span>
            )}
            {transaction.recurringId && (
              <RefreshCw className="h-3 w-3 text-gray-400" />
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            <span>
              {transaction.category?.icon}{' '}
              {transaction.category?.name ?? 'Sem categoria'}
            </span>
            <span>·</span>
            <span>
              {format(new Date(transaction.date), "dd 'de' MMM 'de' yyyy", {
                locale: ptBR,
              })}
            </span>
          </div>
        </div>
        <span className={`text-lg font-semibold ${typeInfo.amountColor}`}>
          {formatCurrency(transaction.amount)}
        </span>
      </button>

      {isPending && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleExecute}
          disabled={isExecuting}
          aria-label="Executar transação"
          className="shrink-0 text-gray-400 hover:text-green-600"
        >
          <CheckCircle className="h-4 w-4" />
        </Button>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-gray-400 hover:text-red-600"
            aria-label="Excluir transação"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Deseja excluir &ldquo;{transaction.description}&rdquo;? Esta ação
              não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
