'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CategoryExpense } from '@/types/calculations';

const COLORS = [
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#3b82f6',
  '#8b5cf6',
];

interface SpendingChartProps {
  categories: CategoryExpense[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

export function SpendingChart({ categories }: SpendingChartProps) {
  if (categories.length === 0) {
    return (
      <div
        data-testid="spending-chart-empty"
        className="flex h-40 items-center justify-center text-sm text-gray-400"
      >
        Nenhuma despesa registrada este mês
      </div>
    );
  }

  // Top 5 categories; bundle the rest into "Outros"
  const top5 = categories.slice(0, 5);
  const others = categories.slice(5);
  const chartData =
    others.length > 0
      ? [
          ...top5,
          {
            categoryId: '__others__',
            categoryName: 'Outros',
            amount: others.reduce((s, c) => s + c.amount, 0),
            percentage: 0,
            transactionCount: 0,
          },
        ]
      : top5;

  // Recharts expects an index-signature-compatible data shape
  const pieData = chartData as unknown as Record<string, unknown>[];

  return (
    <div data-testid="spending-chart">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="amount"
            nameKey="categoryName"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: unknown) => [
              formatCurrency(Number(value)),
              'Gasto',
            ]}
          />
          <Legend
            formatter={value => (
              <span className="text-xs text-gray-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
