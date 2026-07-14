import { NecessityBreakdown } from '@/types/calculations';

export interface SpendingByNecessityProps {
  byNecessityLevel: NecessityBreakdown;
  totalExpenses: number;
}

const levels: {
  key: keyof NecessityBreakdown;
  label: string;
  barColor: string;
  textColor: string;
  bgColor: string;
}[] = [
  {
    key: 'NEEDS',
    label: 'Necessidade',
    barColor: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  {
    key: 'IMPORTANT',
    label: 'Importante',
    barColor: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  {
    key: 'WANTS',
    label: 'Desejo',
    barColor: 'bg-amber-500',
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-100',
  },
  {
    key: 'unclassified',
    label: 'Sem classificação',
    barColor: 'bg-gray-400',
    textColor: 'text-gray-500',
    bgColor: 'bg-gray-100',
  },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function SpendingByNecessity({
  byNecessityLevel,
  totalExpenses,
}: SpendingByNecessityProps) {
  if (totalExpenses === 0) {
    return (
      <p
        data-testid="necessity-empty"
        className="py-8 text-center text-sm text-gray-400"
      >
        Nenhuma despesa registrada este mês
      </p>
    );
  }

  return (
    <div data-testid="necessity-chart" className="space-y-4">
      {levels.map(({ key, label, barColor, textColor, bgColor }) => {
        const amount = byNecessityLevel[key];
        const pct =
          totalExpenses > 0
            ? Math.round((amount / totalExpenses) * 10000) / 100
            : 0;

        return (
          <div key={key}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className={`font-medium ${textColor}`}>{label}</span>
              <span className="text-gray-500">
                {formatCurrency(amount)}{' '}
                <span className="text-gray-400">({pct}%)</span>
              </span>
            </div>
            <div
              className={`h-2 w-full overflow-hidden rounded-full ${bgColor}`}
            >
              <div
                className={`h-2 rounded-full transition-all ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
