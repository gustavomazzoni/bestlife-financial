'use client';

import { useRouter } from 'next/navigation';
import {
  ScheduledForm,
  ScheduledFormData,
} from '@/components/features/scheduled';

export default function ScheduledNewPage() {
  const router = useRouter();

  const handleSubmit = async (data: ScheduledFormData) => {
    const body: Record<string, unknown> = {
      amount: data.amount,
      description: data.description,
      type: data.type,
      categoryId: data.categoryId,
      frequency: data.frequency,
      startDate: data.startDate,
      notificationDaysBefore: data.notificationDaysBefore,
    };
    if (data.frequency !== 'ONCE' && data.endDate) body.endDate = data.endDate;
    if (data.necessityLevel) body.necessityLevel = data.necessityLevel;
    if (data.valueAlignment) body.valueAlignment = data.valueAlignment;

    const res = await fetch('/api/v1/scheduled', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json?.error?.message ?? 'Erro ao criar agendamento');
    }

    router.push('/scheduled');
  };

  return (
    <div>
      <div className="container mx-auto max-w-2xl p-4 sm:p-8">
        <ScheduledForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={() => router.push('/scheduled')}
        />
      </div>
    </div>
  );
}
