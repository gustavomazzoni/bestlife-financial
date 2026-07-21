import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { addMonths, endOfMonth, format, isSameMonth, isToday, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TransactionType } from '@lifeos/shared';
import { colors, fontFamily, fontSize, radius } from '../theme';
import { Card } from '../components/Card';
import { IconBadge } from '../components/IconBadge';
import { ScreenHeader } from '../components/ScreenHeader';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import {
  TransactionDetailSheet,
  TransactionDetailSheetRef,
} from '../components/TransactionDetailSheet';
import {
  ScheduledDetailSheet,
  ScheduledDetailSheetRef,
} from '../components/ScheduledDetailSheet';
import {
  ExecuteScheduledSheet,
  ExecuteScheduledSheetRef,
} from '../components/ExecuteScheduledSheet';
import { useApiData } from '../hooks/useApiData';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/format';
import {
  CalendarEvent,
  getMonthGridDates,
  groupEventsByDate,
  projectScheduledOccurrences,
  transactionsToCalendarEvents,
} from '../lib/calendar';
import { CreditCard, FinancialAccount, ScheduledTransaction, Transaction } from '../types';

const typeColor: Record<string, string> = {
  INCOME: colors.income,
  EXPENSE: colors.expense,
  SAVING: colors.saving,
  TRANSFER: colors.transfer,
};

const WEEKDAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

export function CalendarScreen() {
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const monthKey = format(monthStart, 'yyyy-MM');

  const scheduled = useApiData(() =>
    api.get<ScheduledTransaction[]>('/api/v1/scheduled?isActive=true&limit=100')
  );
  const transactions = useApiData(() =>
    api.get<Transaction[]>(
      `/api/v1/transactions?startDate=${format(monthStart, 'yyyy-MM-dd')}&endDate=${format(monthEnd, 'yyyy-MM-dd')}&limit=100`
    )
  );
  const accounts = useApiData(() => api.get<FinancialAccount[]>('/api/v1/accounts'));
  const creditCards = useApiData(() => api.get<CreditCard[]>('/api/v1/credit-cards'));

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const detailSheetRef = useRef<TransactionDetailSheetRef>(null);

  function openTransaction(sourceId: string) {
    const found = transactions.data?.find(t => t.id === sourceId);
    if (!found) return;
    setSelectedTransaction(found);
    detailSheetRef.current?.present();
  }

  const [selectedScheduled, setSelectedScheduled] = useState<ScheduledTransaction | null>(null);
  const scheduledSheetRef = useRef<ScheduledDetailSheetRef>(null);

  function openScheduled(sourceId: string) {
    const found = scheduled.data?.find(s => s.id === sourceId);
    if (!found) return;
    setSelectedScheduled(found);
    scheduledSheetRef.current?.present();
  }

  // Keep the open sheet's data in sync after a refetch (e.g. right after
  // saving an edit) — without this, `selectedScheduled` keeps pointing at
  // the pre-edit object even once `scheduled.data` has the fresh one,
  // since setting it only ever happens inside openScheduled above.
  useEffect(() => {
    if (!selectedScheduled) return;
    const fresh = scheduled.data?.find(s => s.id === selectedScheduled.id);
    if (fresh && fresh !== selectedScheduled) {
      setSelectedScheduled(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduled.data]);

  const eventsByDate = useMemo((): Map<string, CalendarEvent[]> => {
    if (!scheduled.data || !transactions.data) return new Map();
    const projected = projectScheduledOccurrences(scheduled.data, monthStart, monthEnd);
    const actual = transactionsToCalendarEvents(transactions.data);
    return groupEventsByDate([...projected, ...actual]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduled.data, transactions.data, monthKey]);

  const gridDates = useMemo(
    () => getMonthGridDates(selectedMonth.getFullYear(), selectedMonth.getMonth()),
    [selectedMonth]
  );

  function goToMonth(delta: number) {
    setSelectedMonth(m => addMonths(m, delta));
    setSelectedDay(null);
  }

  const [executingItem, setExecutingItem] = useState<{
    scheduledId: string;
    description: string;
    amount: string;
    type: TransactionType;
    accountId: string | null;
  } | null>(null);
  const executeSheetRef = useRef<ExecuteScheduledSheetRef>(null);

  function openExecute(event: CalendarEvent) {
    const source = scheduled.data?.find(s => s.id === event.sourceId);
    setExecutingItem({
      scheduledId: event.sourceId,
      description: event.description,
      amount: event.amount,
      type: event.type as TransactionType,
      accountId: source?.accountId ?? null,
    });
    executeSheetRef.current?.present();
  }

  const loading = scheduled.loading || transactions.loading;
  const refreshing = scheduled.refreshing || transactions.refreshing;
  const error = scheduled.error ?? transactions.error;

  function refetchAll() {
    scheduled.refetch();
    transactions.refetch();
    accounts.refetch();
    creditCards.refetch();
  }

  if (loading) return <LoadingState />;
  if (error) {
    return <ErrorState message={error} onRetry={refetchAll} />;
  }

  const selectedEvents = selectedDay ? (eventsByDate.get(selectedDay) ?? []) : [];

  return (
    <View style={styles.container} testID="calendar-screen">
      <ScreenHeader
        eyebrow="Organize-se"
        title="Calendário"
        right={
          <View style={styles.monthNav}>
            <Pressable onPress={() => goToMonth(-1)} style={styles.navButton} hitSlop={8}>
              <Feather name="chevron-left" size={16} color={colors.foreground} />
            </Pressable>
            <Pressable onPress={() => goToMonth(1)} style={styles.navButton} hitSlop={8}>
              <Feather name="chevron-right" size={16} color={colors.foreground} />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refetchAll} tintColor={colors.accent} />
        }
      >
        <Card style={styles.calendarCard}>
          <Text style={styles.monthTitle}>
            {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
          </Text>

          <View style={styles.weekHeader}>
            {WEEKDAY_LABELS.map((label, i) => (
              <Text key={i} style={styles.weekLabel}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.grid} testID="calendar-grid">
            {gridDates.map(date => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const events = eventsByDate.get(dateKey) ?? [];
              const inMonth = isSameMonth(date, selectedMonth);
              const selected = selectedDay === dateKey;

              return (
                <Pressable
                  key={dateKey}
                  style={styles.dayCell}
                  onPress={() => setSelectedDay(dateKey)}
                  testID={`calendar-day-${dateKey}`}
                >
                  <View
                    style={[
                      styles.dayNumberWrap,
                      selected && styles.dayCellSelected,
                      isToday(date) && !selected && styles.dayCellToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        !inMonth && styles.dayNumberOutside,
                        selected && styles.dayNumberSelected,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                  <View style={styles.dotsRow}>
                    {events.slice(0, 2).map((e, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          {
                            backgroundColor: typeColor[e.type] ?? colors.mutedForeground,
                            opacity: e.kind === 'scheduled_projection' ? 0.5 : 1,
                          },
                        ]}
                      />
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
              <Text style={styles.legendLabel}>Entrada</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
              <Text style={styles.legendLabel}>Saída</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
              <Text style={styles.legendLabel}>Agendado</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.agendaTitle}>
          {selectedDay ? format(new Date(`${selectedDay}T00:00:00`), "EEEE, d 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}
        </Text>
        {!selectedDay ? (
          <Text style={styles.agendaEmpty}>Selecione um dia para ver os eventos</Text>
        ) : selectedEvents.length === 0 ? (
          <View style={styles.agendaEmptyCard}>
            <Text style={styles.agendaEmpty}>Nenhuma transação neste dia</Text>
          </View>
        ) : (
          selectedEvents.map((e, i) => (
            <Pressable
              key={i}
              onPress={() =>
                e.kind === 'actual'
                  ? openTransaction(e.sourceId)
                  : openScheduled(e.sourceId)
              }
              testID={e.kind === 'actual' ? 'agenda-transaction-item' : 'agenda-scheduled-item'}
            >
              <Card style={styles.eventRow}>
                <IconBadge
                  size={38}
                  color={e.categoryColor ?? colors.mutedForeground2}
                  letter={e.categoryName ?? e.description}
                />
                <View style={styles.rowMain}>
                  <Text style={styles.rowTitle}>{e.description}</Text>
                  <Text style={styles.rowSubtitle}>
                    {e.categoryName ?? '—'}
                    {e.kind === 'scheduled_projection' ? ' · Projetado' : ''}
                  </Text>
                </View>
                <Text style={[styles.rowAmount, { color: typeColor[e.type] }]}>
                  {formatCurrency(e.amount)}
                </Text>
                {e.kind === 'scheduled_projection' && (
                  <Pressable
                    onPress={() => openExecute(e)}
                    style={styles.executeButton}
                    hitSlop={8}
                    testID="agenda-execute-btn"
                  >
                    <Feather name="check-circle" size={20} color={colors.accent} />
                  </Pressable>
                )}
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
      <TransactionDetailSheet
        ref={detailSheetRef}
        transaction={selectedTransaction}
        accounts={accounts.data ?? []}
        creditCards={creditCards.data ?? []}
        onSaved={() => {
          transactions.refetch();
          creditCards.refetch();
        }}
        onDeleted={() => {
          detailSheetRef.current?.dismiss();
          transactions.refetch();
          creditCards.refetch();
        }}
      />
      <ScheduledDetailSheet
        ref={scheduledSheetRef}
        scheduled={selectedScheduled}
        accounts={accounts.data ?? []}
        onSaved={() => {
          scheduled.refetch();
        }}
        onDeleted={() => {
          scheduledSheetRef.current?.dismiss();
          scheduled.refetch();
        }}
      />
      <ExecuteScheduledSheet
        ref={executeSheetRef}
        item={executingItem}
        accounts={accounts.data ?? []}
        onExecuted={() => {
          executeSheetRef.current?.dismiss();
          scheduled.refetch();
          transactions.refetch();
        }}
      />
    </View>
  );
}

const CELL_SIZE = `${100 / 7}%`;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  monthNav: {
    flexDirection: 'row',
    gap: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  calendarCard: {
    padding: 16,
  },
  monthTitle: {
    textAlign: 'center',
    fontFamily: fontFamily.bodyBold,
    fontSize: fontSize.sm,
    color: colors.foreground,
    textTransform: 'capitalize',
    marginBottom: 14,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekLabel: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    color: colors.mutedForeground2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: CELL_SIZE,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dayNumberWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: colors.accent,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: colors.warning,
  },
  dayNumber: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  dayNumberOutside: {
    opacity: 0.35,
  },
  dayNumberSelected: {
    color: colors.accentForeground,
    fontFamily: fontFamily.bodyBold,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    height: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendLabel: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 11,
    color: colors.mutedForeground,
  },
  agendaTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: fontSize.sm,
    color: colors.foreground,
    textTransform: 'capitalize',
    marginTop: 24,
    marginBottom: 12,
  },
  agendaEmpty: {
    fontFamily: fontFamily.bodyMedium,
    color: colors.mutedForeground2,
    textAlign: 'center',
  },
  agendaEmptyCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderDashed,
    borderRadius: radius.lg,
    padding: 26,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 9,
  },
  rowMain: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  rowSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.mutedForeground,
  },
  rowAmount: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize.sm,
  },
  executeButton: {
    marginLeft: 4,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
