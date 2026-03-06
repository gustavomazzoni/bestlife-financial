'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpcomingExecuteButtonProps {
  itemId: string;
  kind: 'scheduled' | 'recurring';
  transactionId?: string;
  recurringId?: string;
}

export function UpcomingExecuteButton({
  itemId,
  kind,
  transactionId,
  recurringId,
}: UpcomingExecuteButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  const handleExecute = async () => {
    setIsPending(true);
    try {
      let url: string;
      if (kind === 'scheduled' && transactionId) {
        url = `/api/v1/transactions/${transactionId}/execute`;
      } else if (kind === 'recurring' && recurringId) {
        url = `/api/v1/recurring/${recurringId}/execute`;
      } else {
        return;
      }

      const response = await fetch(url, { method: 'POST' });
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? 'Erro ao executar');
      }
      router.refresh();
    } catch (err) {
      console.error('Failed to execute item', itemId, err);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handleExecute}
      disabled={isPending}
      aria-label="Marcar como executado"
      data-testid="upcoming-execute-btn"
      className="shrink-0 text-gray-400 hover:text-green-600"
    >
      <CheckCircle className="h-4 w-4" />
    </Button>
  );
}
