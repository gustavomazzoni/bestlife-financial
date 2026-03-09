'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScheduledList } from '@/components/features/scheduled';

export default function ScheduledPage() {
  return (
    <div>
      <div className="container mx-auto space-y-6 p-4 sm:p-8">
        <div className="flex items-center justify-end">
          <Link href="/scheduled/new">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Nova
            </Button>
          </Link>
        </div>
        <ScheduledList />
      </div>
    </div>
  );
}
