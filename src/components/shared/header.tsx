'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ArrowLeft, LogOut } from 'lucide-react';

const SUB_PAGE_CONFIG: Record<string, { title: string; backTo: string }> = {
  '/recurring/new': { title: 'Nova Recorrência', backTo: '/recurring' },
  '/settings/profile': { title: 'Perfil', backTo: '/settings' },
};

function getSubPageConfig(
  pathname: string
): { title: string; backTo: string } | null {
  if (SUB_PAGE_CONFIG[pathname]) return SUB_PAGE_CONFIG[pathname];

  // /recurring/[id] — any segment under /recurring that isn't /new
  if (/^\/recurring\/[^/]+$/.test(pathname) && pathname !== '/recurring/new') {
    return { title: 'Editar Recorrência', backTo: '/recurring' };
  }

  return null;
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return 'U';
}

const HIDDEN_ROUTES = ['/onboarding'];

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();

  if (HIDDEN_ROUTES.some(r => pathname.startsWith(r))) return null;

  const subPage = getSubPageConfig(pathname);
  const initials = getInitials(session?.user?.name, session?.user?.email);

  if (subPage) {
    return (
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.push(subPage.backTo)}
            className="flex items-center gap-1 text-gray-500 transition-colors hover:text-gray-900"
            data-testid="header-back"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold text-gray-900">
            {subPage.title}
          </h1>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <span className="text-lg font-bold text-indigo-600">LifeOS</span>
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700"
            aria-label="Avatar do usuário"
          >
            {initials}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            data-testid="header-logout"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
