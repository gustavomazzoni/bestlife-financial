'use client';

import * as React from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ExecuteTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  scheduledId: string;
  description: string;
  onSuccess: () => void;
}

function todayDateInput(): string {
  return new Date().toISOString().split('T')[0];
}

export function ExecuteTransactionDialog({
  open,
  onClose,
  scheduledId,
  description,
  onSuccess,
}: ExecuteTransactionDialogProps) {
  const [date, setDate] = React.useState(todayDateInput);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setDate(todayDateInput());
      setError(null);
    }
  }, [open]);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/scheduled/${scheduledId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? 'Erro ao executar transação');
      }

      onClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao executar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Marcar como Executada
          </DialogTitle>
          <DialogDescription>
            Confirme a data em que &ldquo;{description}&rdquo; foi realizada.
          </DialogDescription>
        </DialogHeader>

        <Field label="Data de execução" id="exec-date">
          <Input
            id="exec-date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            max={todayDateInput()}
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !date}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {isLoading ? 'Executando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
