import Link from 'next/link';
import { ChevronRight, User } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4 sm:p-8">
      <div className="space-y-2">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Financeiro
        </p>
        <Link
          href="/settings/profile"
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
          data-testid="settings-link-profile"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100">
              <User className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Perfil Financeiro
              </p>
              <p className="text-xs text-gray-500">
                Renda, investimentos e meta de vida
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </Link>
      </div>
    </div>
  );
}
