'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, DollarSign, Plus, CalendarDays, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TransactionQuickEntry } from '@/components/features/transactions';

const LEFT_NAV_ITEMS = [
  {
    href: '/dashboard',
    icon: Home,
    label: 'Início',
    testId: 'nav-dashboard',
  },
  {
    href: '/transactions',
    icon: DollarSign,
    label: 'Transações',
    testId: 'nav-transactions',
  },
] as const;

const RIGHT_NAV_ITEMS = [
  {
    href: '/calendar',
    icon: CalendarDays,
    label: 'Agenda',
    testId: 'nav-calendar',
  },
  {
    href: '/settings',
    icon: Settings,
    label: 'Config.',
    testId: 'nav-settings',
  },
] as const;

const HIDDEN_ROUTES = ['/onboarding'];

function isActive(href: string, pathname: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [quickEntryOpen, setQuickEntryOpen] = React.useState(false);

  if (HIDDEN_ROUTES.some(r => pathname.startsWith(r))) return null;

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white shadow-lg"
        data-testid="bottom-nav"
      >
        <div className="flex items-end justify-around px-2 pb-2 pt-1">
          {LEFT_NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-xs transition-colors ${
                  active
                    ? 'text-indigo-600'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                data-testid={item.testId}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Center "+" button */}
          <button
            className="flex flex-1 flex-col items-center gap-0.5 py-1 text-xs"
            onClick={() => setQuickEntryOpen(true)}
            data-testid="nav-add"
            aria-label="Registrar transação"
          >
            <div className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-gray-500">Registrar</span>
          </button>

          {RIGHT_NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-xs transition-colors ${
                  active
                    ? 'text-indigo-600'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
                data-testid={item.testId}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <Dialog open={quickEntryOpen} onOpenChange={setQuickEntryOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="quick-entry-dialog">
          <DialogHeader>
            <DialogTitle>Registrar Transação</DialogTitle>
          </DialogHeader>
          <TransactionQuickEntry
            onTransactionSaved={() => {
              router.refresh();
              window.dispatchEvent(new Event('transaction-saved'));
              setTimeout(() => setQuickEntryOpen(false), 1500);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
