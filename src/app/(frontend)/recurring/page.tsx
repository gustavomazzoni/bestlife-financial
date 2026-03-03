'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecurringList } from '@/components/features/recurring';

export default function RecurringPage() {
  return (
    <div>
      <div className="container mx-auto space-y-6 p-4 sm:p-8">
        <div className="flex items-center justify-end">
          <Link href="/recurring/new">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Nova
            </Button>
          </Link>
        </div>
        <RecurringList />
      </div>
    </div>
  );
}
