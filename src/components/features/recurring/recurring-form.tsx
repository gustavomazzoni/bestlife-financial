'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TransactionType,
  NecessityLevel,
  ValueAlignment,
  RecurringFrequency,
} from '@/types';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface RecurringFormData {
  description: string;
  amount: string;
  type: TransactionType | '';
  categoryId: string;
  frequency: RecurringFrequency | '';
  startDate: string;
  endDate: string;
  necessityLevel: string;
  valueAlignment: string;
  notificationDaysBefore: number;
}

interface RecurringFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<RecurringFormData>;
  onSubmit: (data: RecurringFormData) => Promise<void>;
  onCancel: () => void;
}

const defaultFormData: RecurringFormData = {
  description: '',
  amount: '',
  type: '',
  categoryId: '',
  frequency: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  necessityLevel: '',
  valueAlignment: '',
  notificationDaysBefore: 3,
};

const typeOptions: { value: TransactionType; label: string }[] = [
  { value: 'INCOME', label: 'Receita' },
  { value: 'EXPENSE', label: 'Despesa' },
  { value: 'SAVING', label: 'Poupança' },
  { value: 'TRANSFER', label: 'Transferência' },
];

const frequencyOptions: { value: RecurringFrequency; label: string }[] = [
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'YEARLY', label: 'Anual' },
];

const necessityOptions: { value: NecessityLevel; label: string }[] = [
  { value: 'NEEDS', label: 'Necessidade' },
  { value: 'IMPORTANT', label: 'Importante' },
  { value: 'WANTS', label: 'Desejo' },
];

const alignmentOptions: { value: ValueAlignment; label: string }[] = [
  { value: 'ALIGNED', label: 'Alinhado' },
  { value: 'DEFAULT', label: 'Padrão' },
  { value: 'EXPERIENCE', label: 'Experiência' },
  { value: 'MATERIAL', label: 'Material' },
  { value: 'FREEDOM_ENABLING', label: 'Liberdade' },
  { value: 'FREEDOM_LIMITING', label: 'Limitante' },
];

export function RecurringForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
}: RecurringFormProps) {
  const [form, setForm] = React.useState<RecurringFormData>({
    ...defaultFormData,
    ...initialData,
  });
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const currentType = form.type;

  // Load categories filtered by type
  React.useEffect(() => {
    if (!currentType) {
      setCategories([]);
      return;
    }
    async function loadCategories() {
      const res = await fetch(`/api/v1/categories?type=${currentType}`);
      if (!res.ok) return;
      const json = await res.json();
      setCategories(json.data ?? []);
    }
    loadCategories();
  }, [currentType]);

  const handleTypeChange = (type: TransactionType) => {
    setForm(prev => ({ ...prev, type, categoryId: '' }));
  };

  const handleSubmit = async () => {
    if (!form.description.trim() || form.description.trim().length < 3) {
      setError('Descrição deve ter pelo menos 3 caracteres');
      return;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError('Valor deve ser positivo');
      return;
    }
    if (!form.type) {
      setError('Selecione o tipo');
      return;
    }
    if (!form.categoryId) {
      setError('Selecione a categoria');
      return;
    }
    if (!form.frequency) {
      setError('Selecione a frequência');
      return;
    }
    if (!form.startDate) {
      setError('Informe a data de início');
      return;
    }
    if (form.endDate && form.endDate <= form.startDate) {
      setError('Data de término deve ser após a data de início');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            value={form.description}
            onChange={e =>
              setForm(prev => ({ ...prev, description: e.target.value }))
            }
            placeholder="Ex: Aluguel, Salário, Plano de saúde"
          />
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <Label htmlFor="amount">Valor (R$)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={e =>
              setForm(prev => ({ ...prev, amount: e.target.value }))
            }
            placeholder="0,00"
          />
        </div>

        {/* Type */}
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select
            value={form.type}
            onValueChange={val => handleTypeChange(val as TransactionType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category — filtered by type */}
        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <Select
            value={form.categoryId}
            onValueChange={val =>
              setForm(prev => ({ ...prev, categoryId: val }))
            }
            disabled={!form.type}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  !form.type
                    ? 'Selecione o tipo primeiro'
                    : 'Selecione a categoria'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Frequency */}
        <div className="space-y-1.5">
          <Label>Frequência</Label>
          <Select
            value={form.frequency}
            onValueChange={val =>
              setForm(prev => ({
                ...prev,
                frequency: val as RecurringFrequency,
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione a frequência" />
            </SelectTrigger>
            <SelectContent>
              {frequencyOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Date */}
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Data de início</Label>
          <Input
            id="startDate"
            type="date"
            value={form.startDate}
            onChange={e =>
              setForm(prev => ({ ...prev, startDate: e.target.value }))
            }
          />
        </div>

        {/* End Date (optional) */}
        <div className="space-y-1.5">
          <Label htmlFor="endDate">Data de término (opcional)</Label>
          <Input
            id="endDate"
            type="date"
            value={form.endDate}
            onChange={e =>
              setForm(prev => ({ ...prev, endDate: e.target.value }))
            }
          />
        </div>

        {/* Necessity Level (optional) */}
        <div className="space-y-1.5">
          <Label>Nível de necessidade (opcional)</Label>
          <Select
            value={form.necessityLevel}
            onValueChange={val =>
              setForm(prev => ({ ...prev, necessityLevel: val }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {necessityOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Value Alignment (optional) */}
        <div className="space-y-1.5">
          <Label>Alinhamento de valores (opcional)</Label>
          <Select
            value={form.valueAlignment}
            onValueChange={val =>
              setForm(prev => ({ ...prev, valueAlignment: val }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {alignmentOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notification Days Before */}
        <div className="space-y-1.5">
          <Label htmlFor="notificationDaysBefore">
            Notificar com antecedência (dias)
          </Label>
          <Input
            id="notificationDaysBefore"
            type="number"
            min="0"
            max="30"
            value={form.notificationDaysBefore}
            onChange={e =>
              setForm(prev => ({
                ...prev,
                notificationDaysBefore: parseInt(e.target.value) || 0,
              }))
            }
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving
            ? 'Salvando...'
            : mode === 'create'
              ? 'Criar recorrência'
              : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}
