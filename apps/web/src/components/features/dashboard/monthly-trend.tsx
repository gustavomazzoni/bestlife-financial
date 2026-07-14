'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MonthlySummary } from '@/types/calculations';

export interface MonthlyTrendProps {
  data: MonthlySummary[];
}

function formatMonthLabel(monthStr: string): string {
  return format(parseISO(`${monthStr}-01`), 'MMM', { locale: ptBR });
}

function formatCurrencyShort(value: number): string {
  if (value >= 1000) return `R$${(value / 1000).toFixed(1)}k`;
  return `R$${value}`;
}

export function MonthlyTrend({ data }: MonthlyTrendProps) {
  const hasData = data.some(d => d.income > 0 || d.expenses > 0);

  if (!hasData) {
    return (
      <p
        data-testid="monthly-trend-empty"
        className="py-8 text-center text-sm text-gray-400"
      >
        Nenhuma transação nos últimos meses
      </p>
    );
  }

  const chartData = data.map(d => ({
    month: formatMonthLabel(d.month),
    Receitas: d.income,
    Despesas: d.expenses,
  })) as unknown as Record<string, unknown>[];

  return (
    <div data-testid="monthly-trend" className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={formatCurrencyShort}
            tick={{ fontSize: 11 }}
            width={60}
          />
          <Tooltip
            formatter={(value: unknown) =>
              new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(value as number)
            }
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
