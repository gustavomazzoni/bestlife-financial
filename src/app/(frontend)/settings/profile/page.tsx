'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileFormState {
  activeIncomeMonthly: string;
  passiveIncomeMonthly: string;
  dreamLifestyleCost: string;
  currentInvestments: string;
}

interface FormErrors {
  activeIncomeMonthly?: string;
  passiveIncomeMonthly?: string;
  dreamLifestyleCost?: string;
  currentInvestments?: string;
  general?: string;
}

function formatDecimal(value: number): string {
  return value === 0 ? '' : String(value);
}

export default function SettingsProfilePage() {
  const router = useRouter();
  const [form, setForm] = React.useState<ProfileFormState>({
    activeIncomeMonthly: '',
    passiveIncomeMonthly: '',
    dreamLifestyleCost: '',
    currentInvestments: '',
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/v1/user/profile');
        if (!res.ok) throw new Error('Erro ao carregar perfil');
        const json = await res.json();
        const data = json.data;
        setForm({
          activeIncomeMonthly: formatDecimal(data.activeIncomeMonthly),
          passiveIncomeMonthly: formatDecimal(data.passiveIncomeMonthly),
          dreamLifestyleCost: formatDecimal(data.dreamLifestyleCost ?? 0),
          currentInvestments: formatDecimal(data.currentInvestments),
        });
      } catch {
        setErrors({ general: 'Erro ao carregar perfil. Tente novamente.' });
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  function validateForm(): FormErrors {
    const errs: FormErrors = {};
    const income = parseFloat(form.activeIncomeMonthly);
    const passive = parseFloat(form.passiveIncomeMonthly || '0');
    const dream = parseFloat(form.dreamLifestyleCost);
    const investments = parseFloat(form.currentInvestments);

    if (isNaN(income) || income < 0)
      errs.activeIncomeMonthly = 'A renda mensal deve ser maior ou igual a 0';
    if (isNaN(passive) || passive < 0)
      errs.passiveIncomeMonthly = 'A renda passiva deve ser maior ou igual a 0';
    if (isNaN(dream) || dream <= 0)
      errs.dreamLifestyleCost =
        'O custo de vida dos sonhos deve ser maior que 0';
    if (isNaN(investments) || investments < 0)
      errs.currentInvestments =
        'Os investimentos atuais devem ser maior ou igual a 0';

    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSaving(true);

    try {
      const res = await fetch('/api/v1/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeIncomeMonthly: parseFloat(form.activeIncomeMonthly),
          passiveIncomeMonthly: parseFloat(form.passiveIncomeMonthly || '0'),
          dreamLifestyleCost: parseFloat(form.dreamLifestyleCost),
          currentInvestments: parseFloat(form.currentInvestments),
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? 'Erro ao salvar perfil');
      }

      setSuccess(true);
      setTimeout(() => router.push('/settings'), 1000);
    } catch (err) {
      setErrors({
        general:
          err instanceof Error
            ? err.message
            : 'Erro ao salvar. Tente novamente.',
      });
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field: keyof ProfileFormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-gray-500">
        Carregando...
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-4 sm:p-8">
      {errors.general && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {errors.general}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          Perfil salvo com sucesso!
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
        data-testid="settings-profile-form"
      >
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">Renda</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="activeIncomeMonthly">
                Renda Ativa Mensal (R$)
              </Label>
              <Input
                id="activeIncomeMonthly"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 8000"
                value={form.activeIncomeMonthly}
                onChange={e =>
                  handleChange('activeIncomeMonthly', e.target.value)
                }
                data-testid="settings-income-input"
              />
              {errors.activeIncomeMonthly && (
                <p className="text-xs text-red-600">
                  {errors.activeIncomeMonthly}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="passiveIncomeMonthly">
                Renda Passiva Mensal (R$)
              </Label>
              <Input
                id="passiveIncomeMonthly"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 1500"
                value={form.passiveIncomeMonthly}
                onChange={e =>
                  handleChange('passiveIncomeMonthly', e.target.value)
                }
                data-testid="settings-passive-income-input"
              />
              {errors.passiveIncomeMonthly && (
                <p className="text-xs text-red-600">
                  {errors.passiveIncomeMonthly}
                </p>
              )}
              <p className="text-xs text-gray-400">
                Dividendos, aluguéis ou outras fontes passivas
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Meta de Liberdade
          </h2>
          <div className="space-y-1.5">
            <Label htmlFor="dreamLifestyleCost">
              Custo de Vida dos Sonhos Mensal (R$)
            </Label>
            <Input
              id="dreamLifestyleCost"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Ex: 15000"
              value={form.dreamLifestyleCost}
              onChange={e => handleChange('dreamLifestyleCost', e.target.value)}
              data-testid="settings-dream-cost-input"
            />
            {errors.dreamLifestyleCost && (
              <p className="text-xs text-red-600">
                {errors.dreamLifestyleCost}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Patrimônio
          </h2>
          <div className="space-y-1.5">
            <Label htmlFor="currentInvestments">
              Investimentos Atuais (R$)
            </Label>
            <Input
              id="currentInvestments"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex: 50000"
              value={form.currentInvestments}
              onChange={e => handleChange('currentInvestments', e.target.value)}
              data-testid="settings-investments-input"
            />
            {errors.currentInvestments && (
              <p className="text-xs text-red-600">
                {errors.currentInvestments}
              </p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={saving || success}
          data-testid="settings-profile-submit"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </form>
    </div>
  );
}
