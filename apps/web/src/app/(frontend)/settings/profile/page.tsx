'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';

const settingsSchema = z.object({
  activeIncomeMonthly: z
    .number()
    .min(0, 'A renda mensal deve ser maior ou igual a 0'),
  passiveIncomeMonthly: z
    .number()
    .min(0, 'A renda passiva deve ser maior ou igual a 0'),
  dreamLifestyleCost: z
    .number()
    .positive('O custo de vida dos sonhos deve ser maior que 0'),
  currentInvestments: z
    .number()
    .min(0, 'Os investimentos atuais devem ser maior ou igual a 0'),
});

type FormValues = z.infer<typeof settingsSchema>;

export default function SettingsProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      activeIncomeMonthly: 0,
      passiveIncomeMonthly: 0,
      dreamLifestyleCost: 0,
      currentInvestments: 0,
    },
  });

  React.useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/v1/user/profile');
        if (!res.ok) throw new Error('Erro ao carregar perfil');
        const json = await res.json();
        const data = json.data;
        reset({
          activeIncomeMonthly: data.activeIncomeMonthly ?? 0,
          passiveIncomeMonthly: data.passiveIncomeMonthly ?? 0,
          dreamLifestyleCost: data.dreamLifestyleCost ?? 0,
          currentInvestments: data.currentInvestments ?? 0,
        });
      } catch {
        setError('root', {
          message: 'Erro ao carregar perfil. Tente novamente.',
        });
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [reset, setError]);

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await fetch('/api/v1/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError('root', {
          message: json?.error?.message ?? 'Erro ao salvar perfil',
        });
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/settings'), 1000);
    } catch {
      setError('root', { message: 'Erro ao salvar. Tente novamente.' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-gray-500">
        Carregando...
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-4 sm:p-8">
      {errors.root && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {errors.root.message}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          Perfil salvo com sucesso!
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        data-testid="settings-profile-form"
      >
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Renda</h2>
          <div className="space-y-4">
            <Field
              label="Renda Ativa Mensal (R$)"
              id="activeIncomeMonthly"
              error={errors.activeIncomeMonthly?.message}
            >
              <Input
                id="activeIncomeMonthly"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 8000"
                data-testid="settings-income-input"
                {...register('activeIncomeMonthly', { valueAsNumber: true })}
              />
            </Field>

            <Field
              label="Renda Passiva Mensal (R$)"
              id="passiveIncomeMonthly"
              error={errors.passiveIncomeMonthly?.message}
              hint="Dividendos, aluguéis ou outras fontes passivas"
            >
              <Input
                id="passiveIncomeMonthly"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 1500"
                data-testid="settings-passive-income-input"
                {...register('passiveIncomeMonthly', { valueAsNumber: true })}
              />
            </Field>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Meta de Liberdade
          </h2>
          <Field
            label="Custo de Vida dos Sonhos Mensal (R$)"
            id="dreamLifestyleCost"
            error={errors.dreamLifestyleCost?.message}
          >
            <Input
              id="dreamLifestyleCost"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Ex: 15000"
              data-testid="settings-dream-cost-input"
              {...register('dreamLifestyleCost', { valueAsNumber: true })}
            />
          </Field>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Patrimônio
          </h2>
          <Field
            label="Investimentos Atuais (R$)"
            id="currentInvestments"
            error={errors.currentInvestments?.message}
          >
            <Input
              id="currentInvestments"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex: 50000"
              data-testid="settings-investments-input"
              {...register('currentInvestments', { valueAsNumber: true })}
            />
          </Field>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || success}
          data-testid="settings-profile-submit"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </div>
  );
}
