'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  RecurringForm,
  RecurringFormData,
} from '@/components/features/recurring';

export default function RecurringNewPage() {
  const router = useRouter();

  const handleSubmit = async (data: RecurringFormData) => {
    const body: Record<string, unknown> = {
      amount: parseFloat(data.amount),
      description: data.description,
      type: data.type,
      categoryId: data.categoryId,
      frequency: data.frequency,
      startDate: data.startDate,
      notificationDaysBefore: data.notificationDaysBefore,
    };
    if (data.endDate) body.endDate = data.endDate;
    if (data.necessityLevel) body.necessityLevel = data.necessityLevel;
    if (data.valueAlignment) body.valueAlignment = data.valueAlignment;

    const res = await fetch('/api/v1/recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.error?.message ?? 'Erro ao criar recorrência');
    }

    router.push('/recurring');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white shadow-sm">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Link
            href="/recurring"
            className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Recorrências
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Nova recorrência</h1>
        </div>
      </nav>

      <div className="container mx-auto max-w-2xl p-4 sm:p-8">
        <RecurringForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={() => router.push('/recurring')}
        />
      </div>
    </div>
  );
}
