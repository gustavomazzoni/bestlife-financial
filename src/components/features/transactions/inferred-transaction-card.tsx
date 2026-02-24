'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { InferTransactionResult, InferredTransaction } from '@/types/infer';
import {
  Check,
  X,
  Pencil,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  ArrowLeftRight,
  AlertCircle,
} from 'lucide-react';
import { TransactionType, NecessityLevel, ValueAlignment } from '@/types';

export interface InferredTransactionCardProps {
  result: InferTransactionResult;
  onConfirm: (transaction: InferredTransaction) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  className?: string;
}

const typeConfig: Record<
  TransactionType,
  { label: string; icon: React.ReactNode; color: string }
> = {
  EXPENSE: {
    label: 'Despesa',
    icon: <TrendingDown className="h-4 w-4" />,
    color: 'text-red-600 bg-red-50',
  },
  INCOME: {
    label: 'Receita',
    icon: <TrendingUp className="h-4 w-4" />,
    color: 'text-green-600 bg-green-50',
  },
  SAVING: {
    label: 'Poupança',
    icon: <PiggyBank className="h-4 w-4" />,
    color: 'text-blue-600 bg-blue-50',
  },
  TRANSFER: {
    label: 'Transferência',
    icon: <ArrowLeftRight className="h-4 w-4" />,
    color: 'text-gray-600 bg-gray-50',
  },
};

const necessityLabels: Record<NecessityLevel, string> = {
  IMPORTANT: 'Importante',
  NEEDS: 'Necessidade',
  WANTS: 'Desejo',
};

const alignmentLabels: Record<ValueAlignment, string> = {
  FREEDOM_ENABLING: 'Liberdade',
  ALIGNED: 'Alinhado',
  DEFAULT: 'Padrão',
  EXPERIENCE: 'Experiência',
  MATERIAL: 'Material',
  FREEDOM_LIMITING: 'Limitante',
};

function formatCurrency(value: number | null): string {
  if (value === null) return 'R$ --';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  const isLow = confidence < 0.5;
  const isMedium = confidence >= 0.5 && confidence < 0.8;

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        isLow && 'bg-red-100 text-red-700',
        isMedium && 'bg-yellow-100 text-yellow-700',
        !isLow && !isMedium && 'bg-green-100 text-green-700'
      )}
    >
      {isLow && <AlertCircle className="h-3 w-3" />}
      <span>{percentage}% confiança</span>
    </div>
  );
}

export function InferredTransactionCard({
  result,
  onConfirm,
  onCancel,
  isSubmitting = false,
  className,
}: InferredTransactionCardProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedTransaction, setEditedTransaction] =
    React.useState<InferredTransaction>(() => ({
      ...result.inferred,
      date: new Date(result.inferred.date),
    }));

  const typeInfo = typeConfig[editedTransaction.type];

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
    const numValue = parseFloat(value);
    setEditedTransaction(prev => ({
      ...prev,
      amount: isNaN(numValue) ? null : numValue,
    }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTransaction(prev => ({
      ...prev,
      description: e.target.value,
    }));
  };

  const handleTypeChange = (type: TransactionType) => {
    setEditedTransaction(prev => ({
      ...prev,
      type,
    }));
  };

  const handleConfirm = () => {
    onConfirm(editedTransaction);
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Transação Detectada</CardTitle>
          <div className="flex items-center gap-2">
            <ConfidenceBadge confidence={result.confidence} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(!isEditing)}
              className="h-8 w-8"
              aria-label={isEditing ? 'Cancelar edição' : 'Editar transação'}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          &ldquo;{result.rawInput}&rdquo;
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Amount */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Valor</Label>
          {isEditing ? (
            <Input
              type="text"
              value={editedTransaction.amount?.toString() ?? ''}
              onChange={handleAmountChange}
              placeholder="0,00"
              className="text-2xl font-bold"
            />
          ) : (
            <p className="text-2xl font-bold">
              {formatCurrency(editedTransaction.amount)}
            </p>
          )}
        </div>

        {/* Type */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Tipo</Label>
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {(Object.keys(typeConfig) as TransactionType[]).map(type => (
                <Button
                  key={type}
                  type="button"
                  variant={
                    editedTransaction.type === type ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => handleTypeChange(type)}
                  className="flex items-center gap-1"
                >
                  {typeConfig[type].icon}
                  {typeConfig[type].label}
                </Button>
              ))}
            </div>
          ) : (
            <div
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
                typeInfo.color
              )}
            >
              {typeInfo.icon}
              {typeInfo.label}
            </div>
          )}
        </div>

        {/* Category */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Categoria</Label>
          <p className="text-sm font-medium">
            {editedTransaction.category?.name ?? 'Não identificada'}
          </p>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Descrição</Label>
          {isEditing ? (
            <Input
              type="text"
              value={editedTransaction.description}
              onChange={handleDescriptionChange}
              placeholder="Descrição da transação"
            />
          ) : (
            <p className="text-sm">{editedTransaction.description}</p>
          )}
        </div>

        {/* Date */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Data</Label>
          <p className="text-sm">
            {format(
              new Date(editedTransaction.date),
              "dd 'de' MMMM 'de' yyyy",
              {
                locale: ptBR,
              }
            )}
          </p>
        </div>

        {/* Tags Row */}
        <div className="flex flex-wrap gap-2">
          {editedTransaction.necessityLevel && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {necessityLabels[editedTransaction.necessityLevel]}
            </span>
          )}
          {editedTransaction.valueAlignment && (
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
              {alignmentLabels[editedTransaction.valueAlignment]}
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isSubmitting || editedTransaction.amount === null}
          className="flex-1"
        >
          <Check className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Salvando...' : 'Confirmar'}
        </Button>
      </CardFooter>
    </Card>
  );
}
