'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

type Step = 1 | 2 | 3;

const onboardingSchema = z.object({
  activeIncomeMonthly: z
    .number()
    .min(0, 'A renda mensal deve ser maior ou igual a 0'),
  dreamLifestyleCost: z
    .number()
    .positive('O custo de vida dos sonhos deve ser maior que 0'),
  currentInvestments: z
    .number()
    .min(0, 'Os investimentos atuais devem ser maior ou igual a 0'),
});

type FormValues = z.infer<typeof onboardingSchema>;

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const stepTitles: Record<Step, string> = {
    1: 'Qual é sua renda mensal líquida?',
    2: 'Qual é o custo do seu estilo de vida dos sonhos?',
    3: 'Quanto você já tem investido?',
  };

  const stepDescriptions: Record<Step, string> = {
    1: 'Informe sua renda mensal após impostos. Pode ser 0 se você vive de renda passiva.',
    2: 'O valor mensal necessário para viver o estilo de vida que você deseja. Usado para calcular seu número FI.',
    3: 'Total em investimentos e poupança atual. Este valor determina seu progresso rumo à independência financeira.',
  };

  const stepFields: Record<Step, keyof FormValues> = {
    1: 'activeIncomeMonthly',
    2: 'dreamLifestyleCost',
    3: 'currentInvestments',
  };

  const stepPlaceholders: Record<Step, string> = {
    1: 'Ex: 8000',
    2: 'Ex: 15000',
    3: 'Ex: 50000',
  };

  const {
    register,
    trigger,
    watch,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onSubmit',
  });

  const currentField = stepFields[step];
  const numValue = watch(currentField);
  const preview =
    typeof numValue === 'number' && !isNaN(numValue)
      ? formatCurrency(numValue)
      : null;
  const fieldError = errors[currentField]?.message ?? apiError;

  async function handleNext() {
    const valid = await trigger(currentField);
    if (!valid) return;
    setApiError(null);
    setStep(s => (s + 1) as Step);
  }

  async function handleConcluir() {
    const valid = await trigger(currentField);
    if (!valid) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      const values = getValues();
      const response = await fetch('/api/v1/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeIncomeMonthly: values.activeIncomeMonthly,
          dreamLifestyleCost: values.dreamLifestyleCost,
          currentInvestments: values.currentInvestments,
        }),
      });

      if (!response.ok) {
        const json = await response.json();
        setApiError(json.error?.message ?? 'Erro ao salvar. Tente novamente.');
        return;
      }

      // Hard-navigate so NextAuth session cookie (onboardingCompleted=true) is picked up
      window.location.href = '/dashboard';
    } catch {
      setApiError('Erro de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">LifeOS</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure seu perfil financeiro
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-xs text-gray-500">
            <span>Etapa {step} de 3</span>
            <span>{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            {stepTitles[step]}
          </h2>
          <p className="mb-6 text-sm text-gray-500">{stepDescriptions[step]}</p>

          <div className="mb-2">
            <label
              htmlFor="step-input"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Valor em R$
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-sm text-gray-400">
                R$
              </span>
              <input
                id="step-input"
                type="number"
                min="0"
                step="0.01"
                placeholder={stepPlaceholders[step]}
                {...register(currentField, { valueAsNumber: true })}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (step < 3) handleNext();
                    else handleConcluir();
                  }
                }}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
            {preview && (
              <p className="mt-1.5 text-sm text-gray-500">{preview}</p>
            )}
            {fieldError && (
              <p className="mt-1.5 text-sm text-red-600">{fieldError}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(s => (s - 1) as Step)}
              className="flex-1 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Voltar
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Próximo
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConcluir}
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Salvando...' : 'Concluir'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
