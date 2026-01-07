import { auth, signOut } from '@/lib/auth/config';

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

      <div className="container mx-auto p-8">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="mt-4 text-gray-600">
            Olá, <strong>{session?.user?.email}</strong>!
          </p>
          <p className="mt-2 text-gray-600">
            Sua jornada para a liberdade financeira começa aqui. 🚀
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900">Transações</h3>
              <p className="mt-2 text-sm text-gray-500">
                Em breve: Registre suas receitas e despesas
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
