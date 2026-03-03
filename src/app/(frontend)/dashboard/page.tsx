import Link from 'next/link';
import { auth, signOut } from '@/lib/auth/config';
import { getUserId } from '@/lib/auth/session';
import { calculateFreedomMetrics } from '@/services/calculations/freedom-metrics';
import { getSpendingBreakdown } from '@/services/calculations/spending-analysis';
import { getMonthlySummary } from '@/services/calculations/monthly-summary';
import { listTransactions } from '@/services/transactions/list';
import { TransactionQuickEntry } from '@/components/features/transactions';
import { MetricsOverview } from '@/components/features/dashboard/metrics-overview';
import { SpendingChart } from '@/components/features/dashboard/spending-chart';
import { RecentTransactions } from '@/components/features/dashboard/recent-transactions';
import { SpendingByNecessity } from '@/components/features/dashboard/spending-by-necessity';
import { MonthlyTrend } from '@/components/features/dashboard/monthly-trend';

export default async function DashboardPage() {
  const [session, userId] = await Promise.all([auth(), getUserId()]);

  const [metrics, spending, recent, monthlySummary] = await Promise.all([
    calculateFreedomMetrics(userId),
    getSpendingBreakdown(userId, 'month'),
    listTransactions(userId, {
      page: 1,
      limit: 10,
      sortBy: 'date',
      sortOrder: 'desc',
    }),
    getMonthlySummary(userId, 3),
  ]);

  const name =
    session?.user?.name || session?.user?.email?.split('@')[0] || 'você';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">LifeOS</h1>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/login' });
            }}
          >
            <button
              type="submit"
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
            >
              Sair
            </button>
          </form>
        </div>
      </nav>

      <div className="container mx-auto space-y-6 p-4 sm:p-8">
        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Olá, {name}!</h2>
          <p className="mt-1 text-sm text-gray-500">
            Sua jornada para a liberdade financeira.
          </p>
        </div>

        {/* Transaction Quick Entry */}
        <div>
          <p className="mb-2 text-sm text-gray-500">
            Digite em linguagem natural, ex: &ldquo;Comprei café e pão, R$
            25&rdquo;
          </p>
          <TransactionQuickEntry className="max-w-2xl" />
        </div>

        {/* Financial Metrics */}
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Métricas
          </h3>
          <MetricsOverview metrics={metrics} spending={spending} />
        </section>

        {/* Spending Chart + Recent Transactions */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-gray-700">
              Gastos por Categoria — Este Mês
            </h3>
            <SpendingChart categories={spending.byCategory} />
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                Últimas Transações
              </h3>
              <Link
                href="/transactions"
                className="text-xs text-indigo-600 hover:underline"
              >
                Ver todas
              </Link>
            </div>
            <RecentTransactions transactions={recent.data} />
          </section>
        </div>

        {/* Necessity Breakdown + Monthly Trend */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-gray-700">
              Gastos por Necessidade — Este Mês
            </h3>
            <SpendingByNecessity
              byNecessityLevel={spending.byNecessityLevel}
              totalExpenses={spending.totalExpenses}
            />
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-gray-700">
              Tendência Mensal — Últimos 3 Meses
            </h3>
            <MonthlyTrend data={monthlySummary} />
          </section>
        </div>
      </div>
    </div>
  );
}
