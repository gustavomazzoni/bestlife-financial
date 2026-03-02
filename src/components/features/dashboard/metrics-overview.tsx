import { FreedomMetrics, SpendingBreakdown } from '@/types/calculations';
import { Progress } from '@/components/ui/progress';

interface MetricsOverviewProps {
  metrics: FreedomMetrics;
  spending: SpendingBreakdown;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercentage(value: number): string {
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

export function MetricsOverview({ metrics, spending }: MetricsOverviewProps) {
  const {
    savingsRate,
    fiProgress,
    currentRunway,
    monthsToFI,
    dreamLifestyleCost,
  } = metrics;
  const { totalExpenses, valueAlignedPercentage } = spending;

  const spendingPercent =
    dreamLifestyleCost > 0
      ? Math.min(100, Math.round((totalExpenses / dreamLifestyleCost) * 100))
      : 0;
  const isOverBudget =
    totalExpenses > dreamLifestyleCost && dreamLifestyleCost > 0;

  const savingsColor =
    savingsRate >= 20
      ? 'text-green-600'
      : savingsRate >= 10
        ? 'text-yellow-600'
        : 'text-red-600';

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* 1. Taxa de Poupança */}
      <div
        data-testid="metric-savings-rate"
        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <p className="text-sm font-medium text-gray-500">Taxa de Poupança</p>
        <p className={`mt-1 text-3xl font-bold ${savingsColor}`}>
          {formatPercentage(savingsRate)}
        </p>
        <p className="mt-1 text-xs text-gray-400">este mês</p>
      </div>

      {/* 2. Progresso FI + Runway */}
      <div
        data-testid="metric-fi-progress"
        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <p className="text-sm font-medium text-gray-500">Progresso FI</p>
        {fiProgress >= 100 ? (
          <p className="mt-1 text-2xl font-bold text-green-600">Já FI!</p>
        ) : (
          <>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              {formatPercentage(fiProgress)}
            </p>
            <Progress value={fiProgress} className="mt-2 h-2" />
            <p className="mt-1 text-xs text-gray-400">
              {currentRunway.toLocaleString('pt-BR', {
                maximumFractionDigits: 1,
              })}{' '}
              meses de runway
              {monthsToFI != null && monthsToFI > 0
                ? ` · ${monthsToFI.toLocaleString('pt-BR')} meses para FI`
                : ''}
            </p>
          </>
        )}
      </div>

      {/* 3. Gastos do Mês vs. Orçamento */}
      <div
        data-testid="metric-monthly-spending"
        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <p className="text-sm font-medium text-gray-500">Gastos do Mês</p>
        <p
          className={`mt-1 text-3xl font-bold ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}
        >
          {formatCurrency(totalExpenses)}
        </p>
        {dreamLifestyleCost > 0 && (
          <>
            <Progress
              value={spendingPercent}
              className={`mt-2 h-2 ${isOverBudget ? '[&>div]:bg-red-500' : ''}`}
            />
            <p className="mt-1 text-xs text-gray-400">
              de {formatCurrency(dreamLifestyleCost)} orçamento
              {isOverBudget ? ' · acima do orçamento' : ''}
            </p>
          </>
        )}
      </div>

      {/* 4. Gastos Alinhados */}
      <div
        data-testid="metric-value-aligned"
        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <p className="text-sm font-medium text-gray-500">Gastos Alinhados</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">
          {formatPercentage(valueAlignedPercentage)}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          necessidades + importantes / total
        </p>
      </div>
    </div>
  );
}
