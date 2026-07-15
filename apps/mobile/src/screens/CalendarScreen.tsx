import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { addMonths, endOfMonth, format, isSameMonth, isToday, startOfMonth } from 'date-fns';
import { colors, fontFamily, fontSize } from '../theme';
import { Card } from '../components/Card';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
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
import { ScheduledTransaction, Transaction } from '../types';

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

  const loading = scheduled.loading || transactions.loading;
  const error = scheduled.error ?? transactions.error;

  if (loading) return <LoadingState />;
  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          scheduled.refetch();
          transactions.refetch();
        }}
      />
    );
  }

  const selectedEvents = selectedDay ? (eventsByDate.get(selectedDay) ?? []) : [];

  return (
    <View style={styles.container} testID="calendar-screen">
      <View style={styles.monthNav}>
        <Pressable onPress={() => goToMonth(-1)} hitSlop={12}>
          <Feather name="chevron-left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={styles.monthTitle}>
          {format(selectedMonth, 'MMMM yyyy')}
        </Text>
        <Pressable onPress={() => goToMonth(1)} hitSlop={12}>
          <Feather name="chevron-right" size={24} color={colors.foreground} />
        </Pressable>
      </View>

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
              style={[
                styles.dayCell,
                selected && styles.dayCellSelected,
                isToday(date) && !selected && styles.dayCellToday,
              ]}
              onPress={() => setSelectedDay(dateKey)}
              testID={`calendar-day-${dateKey}`}
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

      <ScrollView style={styles.agenda} testID="day-agenda">
        {!selectedDay ? (
          <Text style={styles.agendaEmpty}>Selecione um dia para ver os eventos</Text>
        ) : selectedEvents.length === 0 ? (
          <Text style={styles.agendaEmpty}>Nenhum evento neste dia</Text>
        ) : (
          selectedEvents.map((e, i) => (
            <Card
              key={i}
              style={[styles.eventRow, e.kind === 'scheduled_projection' && styles.eventRowProjected]}
            >
              <Text style={styles.rowIcon}>{e.categoryIcon ?? '📊'}</Text>
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
            </Card>
          ))
        )}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  monthTitle: {
    fontFamily: fontFamily.displayBold,
    fontSize: fontSize.lg,
    color: colors.foreground,
    textTransform: 'capitalize',
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  weekLabel: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  dayCell: {
    width: CELL_SIZE,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayCellSelected: {
    backgroundColor: colors.accent,
    borderRadius: 12,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: colors.warning,
    borderRadius: 12,
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
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  agenda: {
    flex: 1,
    padding: 20,
  },
  agendaEmpty: {
    fontFamily: fontFamily.body,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: 24,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  eventRowProjected: {
    borderStyle: 'dashed',
  },
  rowIcon: {
    fontSize: 22,
  },
  rowMain: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  rowSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
  rowAmount: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: fontSize.sm,
  },
});
