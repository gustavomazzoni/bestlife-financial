'use client';

import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecurringList } from '@/components/features/recurring';

export default function RecurringPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Recorrências</h1>
          </div>
          <Link href="/recurring/new">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Nova
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto space-y-6 p-4 sm:p-8">
        <RecurringList />
      </div>
    </div>
  );
}
