'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExecuteTransactionDialog } from '@/components/features/transactions/execute-transaction-dialog';

interface UpcomingExecuteButtonProps {
  scheduledId: string;
  description: string;
}

export function UpcomingExecuteButton({
  scheduledId,
  description,
}: UpcomingExecuteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        data-testid="upcoming-execute-btn"
        aria-label={`Executar ${description}`}
        className="shrink-0 border-green-600 text-green-700 hover:bg-green-50"
      >
        <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
        Executar
      </Button>

      <ExecuteTransactionDialog
        open={open}
        onClose={() => setOpen(false)}
        scheduledId={scheduledId}
        description={description}
        onSuccess={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
