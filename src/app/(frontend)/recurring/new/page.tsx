'use client';

import { useRouter } from 'next/navigation';
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
    <div>
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
