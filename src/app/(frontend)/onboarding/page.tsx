'use client';

import { useState } from 'react';
import { z } from 'zod';

type Step = 1 | 2 | 3;

interface FormData {
  activeIncomeMonthly: string;
  dreamLifestyleCost: string;
  currentInvestments: string;
}

const stepSchemas = {
  1: z.object({
    activeIncomeMonthly: z.coerce
      .number()
      .min(0, 'A renda mensal deve ser maior ou igual a 0'),
  }),
  2: z.object({
    dreamLifestyleCost: z.coerce
      .number()
      .positive('O custo de vida dos sonhos deve ser maior que 0'),
  }),
  3: z.object({
    currentInvestments: z.coerce
      .number()
      .min(0, 'Os investimentos atuais devem ser maior ou igual a 0'),
  }),
};

function formatCurrency(value: string) {
  const num = parseFloat(value.replace(',', '.'));
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>({
    activeIncomeMonthly: '',
    dreamLifestyleCost: '',
    currentInvestments: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const stepFields: Record<Step, keyof FormData> = {
    1: 'activeIncomeMonthly',
    2: 'dreamLifestyleCost',
    3: 'currentInvestments',
  };

  const stepPlaceholders: Record<Step, string> = {
    1: 'Ex: 8000',
    2: 'Ex: 15000',
    3: 'Ex: 50000',
  };

  function validateStep(): boolean {
    const field = stepFields[step];
    const schema = stepSchemas[step];
    const result = schema.safeParse({ [field]: formData[field] });

    if (!result.success) {
      const firstError = result.error.issues[0];
      setError(firstError.message);
      return false;
    }

    setError(null);
    return true;
  }

  function handleNext() {
    if (!validateStep()) return;
    if (step < 3) setStep((s => (s + 1) as Step)(step));
  }

  async function handleSubmit() {
    if (!validateStep()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeIncomeMonthly: parseFloat(
            formData.activeIncomeMonthly.replace(',', '.')
          ),
          dreamLifestyleCost: parseFloat(
            formData.dreamLifestyleCost.replace(',', '.')
          ),
          currentInvestments: parseFloat(
            formData.currentInvestments.replace(',', '.')
          ),
        }),
      });

      if (!response.ok) {
        const json = await response.json();
        setError(json.error?.message ?? 'Erro ao salvar. Tente novamente.');
        return;
      }

      // The PATCH handler called unstable_update() server-side, so the
      // response already carries a refreshed session cookie with
      // onboardingCompleted=true. Hard-navigate to let the proxy see it.
      window.location.href = '/dashboard';
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const field = stepFields[step];
  const currentValue = formData[field];
  const parsedValue = parseFloat(currentValue.replace(',', '.'));
  const preview =
    !isNaN(parsedValue) && currentValue !== ''
      ? formatCurrency(currentValue)
      : null;

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
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm">
                R$
              </span>
              <input
                id="step-input"
                type="number"
                min="0"
                step="0.01"
                placeholder={stepPlaceholders[step]}
                value={currentValue}
                onChange={e => {
                  setError(null);
                  setFormData(prev => ({ ...prev, [field]: e.target.value }));
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    step < 3 ? handleNext() : handleSubmit();
                  }
                }}
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
            {preview && (
              <p className="mt-1.5 text-sm text-gray-500">{preview}</p>
            )}
            {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
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
              onClick={handleSubmit}
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
