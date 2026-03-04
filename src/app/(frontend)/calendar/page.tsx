'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  format,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RecurringList } from '@/components/features/recurring';
import { CalendarGrid, DayAgenda } from '@/components/features/calendar';
import {
  projectRecurringOccurrences,
  transactionsToCalendarEvents,
  groupEventsByDate,
  getCalendarGridDates,
} from '@/lib/utils/calendar';
import type { CalendarEvent, TransactionRow } from '@/types';
import type { RecurringWithCategory } from '@/components/features/recurring';

export default function CalendarPage() {
  const [selectedMonth, setSelectedMonth] = React.useState(() =>
    startOfMonth(new Date())
  );
  const [selectedDay, setSelectedDay] = React.useState<string | null>(null);
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fetchKey, setFetchKey] = React.useState(0);

  React.useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError(null);
      try {
        const start = startOfMonth(selectedMonth);
        const end = endOfMonth(selectedMonth);
        const startStr = format(start, 'yyyy-MM-dd');
        const endStr = format(end, 'yyyy-MM-dd');

        const [recurringRes, transactionsRes] = await Promise.all([
          fetch('/api/v1/recurring?isActive=true&limit=100'),
          fetch(
            `/api/v1/transactions?startDate=${startStr}&endDate=${endStr}&limit=100`
          ),
        ]);

        if (!recurringRes.ok) throw new Error('Erro ao carregar recorrências');
        if (!transactionsRes.ok) throw new Error('Erro ao carregar transações');

        const recurringJson = await recurringRes.json();
        const transactionsJson = await transactionsRes.json();

        const recurrings: RecurringWithCategory[] = recurringJson.data ?? [];
        const transactions: TransactionRow[] = transactionsJson.data ?? [];

        const projections = projectRecurringOccurrences(recurrings, start, end);
        const actuals = transactionsToCalendarEvents(transactions);

        setEvents([...projections, ...actuals]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [selectedMonth, fetchKey]);

  const handlePrevMonth = () => {
    setSelectedMonth(m => subMonths(m, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setSelectedMonth(m => addMonths(m, 1));
    setSelectedDay(null);
  };

  const eventsByDate = groupEventsByDate(events);
  const gridDates = getCalendarGridDates(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth()
  );
  const selectedEvents = selectedDay
    ? (eventsByDate.get(selectedDay) ?? [])
    : [];

  const monthTitle = format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <Tabs defaultValue="calendar">
        <TabsList className="mb-4">
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          {/* Month navigation */}
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
              aria-label="Mês anterior"
              data-testid="month-prev"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2
              className="text-base font-semibold capitalize text-gray-900"
              data-testid="month-title"
            >
              {monthTitle}
            </h2>
            <button
              onClick={handleNextMonth}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100"
              aria-label="Próximo mês"
              data-testid="month-next"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-700">
              {error}
              <button
                onClick={() => setFetchKey(k => k + 1)}
                className="ml-2 underline"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <CalendarGrid
                gridDates={gridDates}
                currentMonth={selectedMonth}
                eventsByDate={eventsByDate}
                selectedDay={selectedDay}
                onDaySelect={setSelectedDay}
              />
              <DayAgenda date={selectedDay} events={selectedEvents} />
            </>
          )}
        </TabsContent>

        <TabsContent value="list">
          <div className="mb-4 flex items-center justify-end">
            <Link href="/recurring/new">
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Nova
              </Button>
            </Link>
          </div>
          <RecurringList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
