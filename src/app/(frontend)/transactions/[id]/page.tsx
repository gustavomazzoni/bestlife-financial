'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TransactionType, NecessityLevel, ValueAlignment } from '@/types';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

interface Transaction {
  id: string;
  amount: string;
  description: string;
  date: string;
  type: TransactionType;
  categoryId: string;
  necessityLevel: NecessityLevel | null;
  valueAlignment: ValueAlignment | null;
  notes: string | null;
}

interface FormState {
  amount: string;
  description: string;
  date: string;
  type: TransactionType;
  categoryId: string;
  necessityLevel: string;
  valueAlignment: string;
  notes: string;
}

const typeOptions: { value: TransactionType; label: string }[] = [
  { value: 'INCOME', label: 'Receita' },
  { value: 'EXPENSE', label: 'Despesa' },
  { value: 'SAVING', label: 'Poupança' },
  { value: 'TRANSFER', label: 'Transferência' },
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

function toDateInput(dateStr: string): string {
  return new Date(dateStr).toISOString().split('T')[0];
}

export default function TransactionEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [transaction, setTransaction] = React.useState<Transaction | null>(
    null
  );
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [form, setForm] = React.useState<FormState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // Initial fetch
  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/transactions/${id}`);
        if (res.status === 404) {
          router.replace('/transactions');
          return;
        }
        if (!res.ok) throw new Error('Erro ao carregar transação');
        const json = await res.json();
        const txn: Transaction = json.data;
        setTransaction(txn);
        setForm({
          amount: String(parseFloat(txn.amount)),
          description: txn.description,
          date: toDateInput(txn.date),
          type: txn.type,
          categoryId: txn.categoryId,
          necessityLevel: txn.necessityLevel ?? '',
          valueAlignment: txn.valueAlignment ?? '',
          notes: txn.notes ?? '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  // Fetch categories when type changes
  const currentType = form?.type;
  React.useEffect(() => {
    if (!currentType) return;
    async function loadCategories() {
      const res = await fetch(`/api/v1/categories?type=${currentType}`);
      if (!res.ok) return;
      const json = await res.json();
      setCategories(json.data ?? []);
    }
    loadCategories();
  }, [currentType]);

  const handleTypeChange = (type: TransactionType) => {
    setForm(prev => (prev ? { ...prev, type, categoryId: '' } : prev));
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        amount: parseFloat(form.amount),
        description: form.description,
        date: form.date,
        type: form.type,
        categoryId: form.categoryId,
      };
      if (form.necessityLevel) body.necessityLevel = form.necessityLevel;
      if (form.valueAlignment) body.valueAlignment = form.valueAlignment;
      if (form.notes) body.notes = form.notes;

      const res = await fetch(`/api/v1/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message || 'Erro ao salvar transação');
      }
      router.push('/transactions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/transactions/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erro ao excluir transação');
      router.push('/transactions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir');
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-24 text-gray-500">
          Carregando...
        </div>
      </div>
    );
  }

  if (!transaction || !form) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white shadow-sm">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Link
            href="/transactions"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Transações
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Editar transação</h1>
        </div>
      </nav>

      <div className="container mx-auto max-w-2xl p-4 sm:p-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* Amount */}
            <div className="space-y-1.5">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={e =>
                  setForm(prev =>
                    prev ? { ...prev, amount: e.target.value } : prev
                  )
                }
                placeholder="0,00"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={form.description}
                onChange={e =>
                  setForm(prev =>
                    prev ? { ...prev, description: e.target.value } : prev
                  )
                }
                placeholder="Ex: Compras no mercado"
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={e =>
                  setForm(prev =>
                    prev ? { ...prev, date: e.target.value } : prev
                  )
                }
              />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(val: string) =>
                  handleTypeChange(val as TransactionType)
                }
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

            {/* Category */}
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select
                value={form.categoryId}
                onValueChange={(val: string) =>
                  setForm(prev => (prev ? { ...prev, categoryId: val } : prev))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a categoria" />
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

            {/* Necessity Level */}
            <div className="space-y-1.5">
              <Label>Nível de necessidade (opcional)</Label>
              <Select
                value={form.necessityLevel}
                onValueChange={(val: string) =>
                  setForm(prev =>
                    prev ? { ...prev, necessityLevel: val } : prev
                  )
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

            {/* Value Alignment */}
            <div className="space-y-1.5">
              <Label>Alinhamento de valores (opcional)</Label>
              <Select
                value={form.valueAlignment}
                onValueChange={(val: string) =>
                  setForm(prev =>
                    prev ? { ...prev, valueAlignment: val } : prev
                  )
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

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={e =>
                  setForm(prev =>
                    prev ? { ...prev, notes: e.target.value } : prev
                  )
                }
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar exclusão</DialogTitle>
                  <DialogDescription>
                    Deseja excluir esta transação? Esta ação não pode ser
                    desfeita.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                    disabled={deleting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Excluindo...' : 'Excluir'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/transactions')}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
