'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExecuteTransactionDialog } from '@/components/features/transactions/execute-transaction-dialog';

interface UpcomingExecuteButtonProps {
  itemId: string;
  kind: 'scheduled' | 'recurring';
  description: string;
  transactionId?: string;
  recurringId?: string;
}

export function UpcomingExecuteButton({
  itemId: _itemId,
  kind,
  description,
  transactionId,
  recurringId,
}: UpcomingExecuteButtonProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
        data-testid="upcoming-execute-btn"
        className="shrink-0 border-green-600 text-green-700 hover:bg-green-50"
      >
        <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
        Executar
      </Button>

      <ExecuteTransactionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        kind={kind}
        description={description}
        transactionId={transactionId}
        recurringId={recurringId}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
