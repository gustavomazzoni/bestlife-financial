import { auth, signOut } from '@/lib/auth/config';
import { TransactionQuickEntry } from '@/components/features/transactions';

export default async function DashboardPage() {
  const session = await auth();

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

      <div className="container mx-auto p-4 sm:p-8">
        {/* Transaction Quick Entry - Primary Interface */}
        <div className="mb-8">
          <div className="mb-4 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Qual é a sua transação?
            </h2>
            <p className="text-sm text-gray-500">
              Digite em linguagem natural, ex: &ldquo;Comprei café e pão, R$
              25&rdquo;
            </p>
          </div>
          <TransactionQuickEntry className="mx-auto max-w-2xl" />
        </div>

        {/* Welcome Section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">
            Olá, {session?.user?.name || session?.user?.email?.split('@')[0]}!
          </h2>
          <p className="mt-2 text-gray-600">
            Sua jornada para a liberdade financeira começa aqui.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900">Transações</h3>
              <p className="mt-2 text-sm text-gray-500">
                Use o campo acima para registrar suas transações
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900">
                Métricas de Liberdade
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Em breve: Acompanhe seu progresso
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900">
                Custo de Vida dos Sonhos
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Em breve: Defina seu estilo de vida ideal
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
